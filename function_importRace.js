function importRace (character, data) {
    const renderer = new Renderer();
    renderer.setBaseUrl(BASE_SITE_URL);

    const race = data.Vetoolscontent;

    race.entries.filter(it => typeof it !== "string").forEach(e => {
        const renderStack = [];
        renderer.recursiveRender({entries: e.entries}, renderStack);
        e.text = d20plus.importer.getCleanText(renderStack.join(""));
    });

    const attrs = new CharacterAttributesProxy(character);
    d20plus.ut.log(race);
    if (d20plus.sheet === "ogl") {
        attrs.addOrUpdate(`race`, race._baseName);
        if (race._isSubRace){
            d20plus.ut.log("Subrazas: "+ race._subraceName);
            attrs.addOrUpdate(`race_display`, race._subraceName);
            attrs.addOrUpdate(`subrace`, race._subraceName);
        }else {
            attrs.addOrUpdate(`race_display`, "Sin Subraza");
            attrs.addOrUpdate(`subrace`, "Sin Subraza");
        }
        attrs.addOrUpdate(`speed`, Parser.getSpeedString(race));

        attrs.addOrUpdate(`strength_base`, race.ability[0].str);
        attrs.addOrUpdate(`dexterity_base`, race.ability[0].dex);
        attrs.addOrUpdate(`constitution_base`, race.ability[0].con);
        attrs.addOrUpdate(`intelligence_base`, race.ability[0].int);
        attrs.addOrUpdate(`wisdom_base`, race.ability[0].wis);
        attrs.addOrUpdate(`charisma_base`, race.ability[0].cha);

        race.entries.filter(it => it.text).forEach(e => {
            const fRowId = d20plus.ut.generateRowId();
            attrs.add(`repeating_traits_${fRowId}_name`, e.name);
            attrs.add(`repeating_traits_${fRowId}_source`, "Race");
            attrs.add(`repeating_traits_${fRowId}_source_type`, race.name);
            attrs.add(`repeating_traits_${fRowId}_description`, e.text);
            attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
        });

        if (race.languageProficiencies && race.languageProficiencies.length) {
            // FIXME this discards information
            const profs = race.languageProficiencies[0];
            const asText = Object.keys(profs).filter(it => it !== "choose").map(it => it === "anyStandard" ? "any" : it).map(it => it.toTitleCase()).join(", ");

            const lRowId = d20plus.ut.generateRowId();
            attrs.add(`repeating_proficiencies_${lRowId}_name`, asText);
            attrs.add(`repeating_proficiencies_${lRowId}_options-flag`, "0");
        }
    } else if (d20plus.sheet === "shaped") {
        attrs.addOrUpdate("race", race.name);
        attrs.addOrUpdate("size", (race.size || [SZ_VARIES]).map(sz => Parser.sizeAbvToFull(sz)).join("/").toUpperCase());
        attrs.addOrUpdate("speed_string", Parser.getSpeedString(race));

        if (race.speed instanceof Object) {
            for (const locomotion of ["walk", "burrow", "climb", "fly", "swim"]) {
                if (race.speed[locomotion]) {
                    const attrName = locomotion === "walk" ? "speed" : `speed_${locomotion}`;
                    if (locomotion !== "walk") {
                        attrs.addOrUpdate("other_speeds", "1");
                    }
                    // note: this doesn't cover hover
                    attrs.addOrUpdate(attrName, race.speed[locomotion]);
                }
            }
        } else {
            attrs.addOrUpdate("speed", race.speed);
        }

        // really there seems to be only darkvision for PCs
        for (const vision of ["darkvision", "blindsight", "tremorsense", "truesight"]) {
            if (race[vision]) {
                attrs.addOrUpdate(vision, race[vision]);
            }
        }

        race.entries.filter(it => it.text).forEach(e => {
            const fRowId = d20plus.ut.generateRowId();
            attrs.add(`repeating_racialtrait_${fRowId}_name`, e.name);
            attrs.add(`repeating_racialtrait_${fRowId}_content`, e.text);
            attrs.add(`repeating_racialtrait_${fRowId}_content_toggle`, "1");
        });

        const fRowId = d20plus.ut.generateRowId();
        attrs.add(`repeating_modifier_${fRowId}_name`, race.name);
        attrs.add(`repeating_modifier_${fRowId}_ability_score_toggle`, "1");
        (race.ability || []).forEach(raceAbility => {
            Object.keys(raceAbility).filter(it => it !== "choose").forEach(abilityAbv => {
                const value = raceAbility[abilityAbv];
                const ability = Parser.attAbvToFull(abilityAbv).toLowerCase();
                attrs.add(`repeating_modifier_${fRowId}_${ability}_score_modifier`, value);
            });
        });
    } else {
        console.warn(`Race import is not supported for ${d20plus.sheet} character sheet`);
    }

    attrs.notifySheetWorkers();
}