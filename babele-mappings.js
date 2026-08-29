/* eslint-disable */
/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * 生成文件，禁止手改。手改会在下一次跑生成器时被无声覆盖。
 *
 * Source of truth:
 *   Alien-RPG Translation Project/4-常用脚本/extract/mappings.mjs        (ALIEN_LAYER)
 *   Alien-RPG Translation Project/4-常用脚本/release/runtime-converters.alien.js (缺席，已用空壳)
 * Regenerate with:
 *   node "4-常用脚本/release/generate_runtime.mjs"
 *
 * Module : alienrpg-cn
 * Layer  : ALIEN_LAYER
 *
 * 导出的 mapping 交给 `babele.registerMapping()`。它是**全局层**，只 ENRICH
 * Babele 的内置默认值：没提到的字段（尤其 `Adventure.actors` 与 `Actor.items`）
 * 保留 Babele 自己的 `document` converter —— 那条路径才提供 source-pack 回退：
 * 带 `_stats.compendiumSource` 的内嵌文档会从它**原本所属**的包的译文里取翻译。
 * 不要用手写的遍历 converter 去替换它们。
 *
 * ⚠ 全局层对**所有系统的所有文档**生效，不只是 alienrpg。凡是可能撞上别人字段名
 * 的 variant，都要带 `_when` 守卫（mapping-block.js:176-206 支持
 * all / any / equals / in / exists）。
 */

/* ------------------------------------------------------------------ *
 * Runtime converters (translate direction).
 *
 * 尚未编写。这些 converter 的 EXTRACT 方向住在
 * 4-常用脚本/extract/extract_en.mjs —— 改动一侧产出的形状时，**同一个 commit**
 * 里改另一侧。
 *
 * Babele 的函数式 converter 签名（babele 2.9.1）：
 *   fn(value, translation, source, contextCompendium, allTranslations, runtime, params)
 * ------------------------------------------------------------------ */

export const PROJECT_CONVERTERS = {};


export const DOCUMENT_MAPPINGS = {
  "Adventure": {
    "name": "name",
    "description": "description",
    "caption": "caption",
    "items": {
      "path": "items",
      "converter": "document",
      "documentType": "Item",
      "cardinality": "many",
      "expose": true
    },
    "tables": {
      "path": "tables",
      "converter": "document",
      "documentType": "RollTable",
      "cardinality": "many",
      "expose": true
    }
  },
  "Item": {
    "_variants": [
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "item",
                "weapon",
                "armor",
                "talent",
                "specialty",
                "spacecraftweapons",
                "spacecraftmods",
                "agenda",
                "colony-initiative",
                "planet-system",
                "spacecraft-crit",
                "critical-injury",
                "skill-stunts"
              ]
            },
            {
              "path": "system.notes",
              "exists": true
            }
          ]
        },
        "notes": "system.notes"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "item",
                "weapon",
                "armor",
                "spacecraftmods",
                "spacecraftweapons"
              ]
            },
            {
              "path": "system.attributes.comment.value",
              "exists": true
            }
          ]
        },
        "description": "system.attributes.comment.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "agenda",
                "talent",
                "specialty"
              ]
            },
            {
              "path": "system.general.comment.value",
              "exists": true
            }
          ]
        },
        "description": "system.general.comment.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "skill-stunts"
              ]
            },
            {
              "path": "system.description",
              "exists": true
            }
          ]
        },
        "description": "system.description"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "planet-system"
              ]
            },
            {
              "path": "system.misc.description.value",
              "exists": true
            },
            {
              "path": "system.details.classification.value",
              "exists": true
            }
          ]
        },
        "description": "system.misc.description.value",
        "commonName": "system.header.commonName.value",
        "starSystem": "system.header.system.value",
        "sector": "system.header.sector.value",
        "location": "system.header.location.value",
        "affiliation": "system.details.affiliation.value",
        "classification": "system.details.classification.value",
        "climate": "system.details.climate.value",
        "meanTemperature": "system.details.meanTemperature.value",
        "terrain": "system.details.terrain.value",
        "colonies": "system.details.colonies.value",
        "keyResources": "system.details.keyResources.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "critical-injury"
              ]
            },
            {
              "path": "system.attributes.effects",
              "exists": true
            }
          ]
        },
        "description": "system.attributes.effects",
        "healingTime": "system.attributes.healingtime.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "spacecraft-crit"
              ]
            },
            {
              "path": "system.header.effects",
              "exists": true
            }
          ]
        },
        "description": "system.header.effects",
        "repairRoll": "system.header.repairroll"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "colony-initiative"
              ]
            },
            {
              "path": "system.header.comment",
              "exists": true
            }
          ]
        },
        "description": "system.header.comment"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "weapon"
              ]
            },
            {
              "path": "system.attributes.class.value",
              "exists": true
            }
          ]
        },
        "weaponClass": "system.attributes.class.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "spacecraftmods"
              ]
            },
            {
              "path": "system.attributes.capacity.value",
              "exists": true
            }
          ]
        },
        "capacity": "system.attributes.capacity.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "item"
              ]
            },
            {
              "path": "system.attributes.notes.value",
              "exists": true
            }
          ]
        },
        "attributeNotes": "system.attributes.notes.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "weapon"
              ]
            },
            {
              "path": "system.attributes.notes.notes",
              "exists": true
            }
          ]
        },
        "attributeNotes": "system.attributes.notes.notes"
      }
    ]
  },
  "Actor": {
    "_variants": [
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "character",
                "synthetic",
                "creature",
                "spacecraft",
                "colony",
                "planet"
              ]
            },
            {
              "path": "system.notes",
              "exists": true
            }
          ]
        },
        "notes": "system.notes"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "territory"
              ]
            },
            {
              "path": "system.notes",
              "exists": true
            }
          ]
        },
        "notes": "system.notes"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "vehicles"
              ]
            },
            {
              "path": "system.notes.notes",
              "exists": true
            }
          ]
        },
        "notes": "system.notes.notes"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "creature"
              ]
            },
            {
              "path": "system.general.special.value",
              "exists": true
            }
          ]
        },
        "special": "system.general.special.value",
        "rollTable": {
          "path": "system.rTables",
          "converter": "alienRollTableRef"
        },
        "critTable": {
          "path": "system.cTables",
          "converter": "alienRollTableRef"
        }
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "character",
                "synthetic"
              ]
            },
            {
              "path": "system.general.appearance.value",
              "exists": true
            }
          ]
        },
        "appearance": "system.general.appearance.value",
        "adhocItems": "system.adhocitems",
        "signatureItem": "system.general.sigItem.value",
        "agenda": "system.general.agenda.value",
        "relationshipOne": "system.general.relOne.value",
        "relationshipTwo": "system.general.relTwo.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "vehicles"
              ]
            },
            {
              "path": "system.attributes.comment.value",
              "exists": true
            }
          ]
        },
        "comment": "system.attributes.comment.value",
        "misc": "system.general.misc.value"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "spacecraft"
              ]
            },
            {
              "path": "system.attributes.manufacturer",
              "exists": true
            }
          ]
        },
        "misc": "system.general.misc.value",
        "manufacturer": "system.attributes.manufacturer",
        "model": "system.attributes.model",
        "ai": "system.attributes.ai",
        "modules": "system.attributes.modules",
        "armaments": "system.attributes.armaments"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "colony"
              ]
            },
            {
              "path": "system.attributes.mission",
              "exists": true
            }
          ]
        },
        "misc": "system.general.misc.value",
        "colonyName": "system.header.colonyname",
        "location": "system.attributes.location",
        "mission": "system.attributes.mission",
        "established": "system.attributes.established",
        "cycles": "system.attributes.cycles",
        "sponsor": "system.attributes.sponsor",
        "commander": "system.attributes.commander",
        "economyDirector": "system.attributes.economydirector",
        "potentialName": "system.attributes.potentialname",
        "productivityName": "system.attributes.productivityname",
        "maintenanceName": "system.attributes.maintenancename",
        "scienceName": "system.attributes.sciencename",
        "spiritName": "system.attributes.spiritname",
        "statsNotes": "system.stats.notes"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "planet"
              ]
            },
            {
              "path": "system.attributes.parentstar",
              "exists": true
            }
          ]
        },
        "misc": "system.general.misc.value",
        "colonyName": "system.header.colonyname",
        "parentStar": "system.attributes.parentstar",
        "radiation": "system.attributes.radiation",
        "planetSize": "system.attributes.planetsize",
        "atmosphere": "system.attributes.atmosphere",
        "hydrosphere": "system.attributes.hydrosphere",
        "dayLength": "system.attributes.daylength",
        "axialTilt": "system.attributes.axialtilt",
        "gravity": "system.attributes.gravity",
        "climate": "system.attributes.climate",
        "globalFeature": "system.attributes.globalfeature",
        "orbitalPeriod": "system.attributes.orbitalperiod",
        "personality": "system.attributes.personality",
        "northPole": "system.attributes.northpole",
        "equator": "system.attributes.equator",
        "southPole": "system.attributes.southpole",
        "nhWest": "system.attributes.nhwest",
        "nhSouth": "system.attributes.nhsouth",
        "nhEast": "system.attributes.nheast",
        "shEast": "system.attributes.sheast",
        "shWest": "system.attributes.shwest"
      },
      {
        "_when": {
          "all": [
            {
              "path": "type",
              "in": [
                "territory"
              ]
            },
            {
              "path": "system.sectors.value",
              "exists": true
            }
          ]
        },
        "sectors": "system.sectors.value",
        "comment": "system.comment.value"
      }
    ]
  },
  "Scene": {
    "navName": "navName",
    "tokens": {
      "path": "tokens",
      "converter": "nameCollection"
    }
  }
};
