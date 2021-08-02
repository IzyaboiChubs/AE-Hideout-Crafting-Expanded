exports.mod = (mod_data) => {
	const fs = require("fs");
	const path = require("path");
	const config = require("../config.js");

	const PathResolver = global.internal.path.resolve;
	const ModTemplate = mod_data.template;
	const ModAreas = mod_data.areas;
	const ModDirectories = mod_data.directories;

	const configSize = Object.keys(config).length;
	const recipesDir = path.join(__dirname, "../", ModDirectories[0]);
	const templateFile = path.join(__dirname, "../", ModDirectories[1] + ModTemplate);
	let newRec = global.fileIO.readParsed(PathResolver('user/cache/hideout_production.json'));

	if (validateConfig()) {
		createCraftingRecipes();
	} else {
		logger.logError("[MOD] Hideout Crafting Expanded by Chubs encountered errors! Mod was not applied...");
	}

	function validateConfig() {
		let validationSource = global.fileIO.readParsed(db.user.cache.items);
		let validationData = Object.keys(validationSource.data);
		let isConfigValid = true;

		recipeLoop:
			for (let x = 0; x < configSize; x++) {
				const recipeName = config[x].RecipeName;
				const components = config[x].Requirements.Components;
				const areaLevel = config[x].Requirements.AreaLevel;
				const productionTime = config[x].ProductConfiguration.ProductionTime;
				const receiveHowMany = config[x].ProductConfiguration.ReceiveHowMany;
				let hideoutArea = config[x].HideoutArea;
				let endProduct = config[x].ProductConfiguration.EndProduct;

				const componentItems = [];

				if (typeof recipeName != "string") {
					logger.logError(`RecipeName must be a string! This field in the ${x + 1}(st|nd|rd|th) recipe is invalid.`);
					isConfigValid = false;
					break;
				} else if (typeof hideoutArea != "string") {
					logger.logError(`HideoutArea must be a string! This field in the ${x + 1}(st|nd|rd|th) recipe is invalid.`);
					isConfigValid = false;
					break;
				} else if (!Array.isArray(components)) {
					logger.logError(`Components must be an array of string! This field in the ${x + 1}(st|nd|rd|th) recipe is invalid.`);
					isConfigValid = false;
					break;
				} else if (typeof areaLevel != "number") {
					logger.logError(`AreaLevel must be a number! This field in the ${x + 1}(st|nd|rd|th) recipe is invalid.`);
					isConfigValid = false;
					break;
				} else if (typeof productionTime != "number") {
					logger.logError(`ProductionTime must be a number! This field in the ${x + 1}(st|nd|rd|th) recipe is invalid.`);
					isConfigValid = false;
					break;
				} else if (typeof endProduct != "string") {
					logger.logError(`EndProduct must be a string! This field in the ${x + 1}(st|nd|rd|th) recipe is invalid.`);
					isConfigValid = false;
					break;
				} else if (typeof receiveHowMany != "number") {
					logger.logError(`ReceiveHowMany must be a number! This field in the ${x + 1}(st|nd|rd|th) recipe is invalid.`);
					isConfigValid = false;
					break;
				} else if (!recipeName) {
					logger.logError(`RecipeName from the ${x + 1}(st|nd|rd|th) recipe is blank. This field must not be blank.`);
					isConfigValid = false;
					break;
				}

				for (let component in components) {
					if (typeof components[component] != "string") {
						logger.logError(`A component must be a string! Check for invalid records in the Components field of the ${x + 1}(st|nd|rd|th) recipe.`);
						isConfigValid = false;
						break recipeLoop;
					}
				}

				hideoutArea = hideoutArea.toLowerCase().replace(/\s/g,'');
				endProduct = endProduct.replace(/\s/g,'');

				if (!hideoutArea) {
					logger.logError(`No fields for a recipe can be blank! HideoutArea field in the ${recipeName} recipe is found blank.`);
					isConfigValid = false;
				} else if (!Object.keys(ModAreas).includes(hideoutArea)) {
					logger.logError(`HideoutArea value (${hideoutArea}) from the ${recipeName} recipe is unrecognized. Valid inputs are [ Lavatory | MedStation | Nutrition Unit | Workbench | Intelligence Center ].`);
					isConfigValid = false;
				}

				if (components.length < 1) {
					logger.logError(`Components for the ${recipeName} recipe must be defined!`);
					isConfigValid = false;
				} else {
					for (let i = 0; i < components.length; i++) {
						const component = components[i].split(":");

						if (component.length == 1) {
							logger.logError(`A component given in ${recipeName} is invalid. Please make sure to follow this format: <item_id_for_component>:<how_many_are_needed>`);
							isConfigValid = false;
						} else {
							const componentItem = component[0].replace(/\s/g,'');
							const componentCount = Math.trunc(component[1].replace(/\s/g,''));
							
							if (!componentItem) {
								logger.logError(`An item ID for a component from the ${recipeName} is blank. This cannot be blank.`);
								isConfigValid = false;
							} else if (!validationData.includes(componentItem)) {
								logger.logError(`Component item ID (${componentItem}) from the ${recipeName} recipe is invalid. Please double check.`);
								isConfigValid = false;
							}
			
							if (isNaN(componentCount)) {
								logger.logError(`Count for how many of the components are needed (${componentCount}) cannot be converted to a number. A component in the ${x + 1}(st|nd|rd|th) recipe is invalid.`);
								isConfigValid = false;
							} else if (componentCount < 1) {
								logger.logError(`Please input a number greater than 0 for how many of the component is needed for the crafting recipe. Component count value (${componentCount}) for ${componentItem} from the ${recipeName} recipe is either blank or invalid!`);
								isConfigValid = false;
							}

							componentItems.push(componentItem);

							const validatorArray = componentItems.sort();

							for (let y = 0; y < validatorArray.length; y++) {
								if (validatorArray[y + 1] === validatorArray[y]) {
									logger.logError(`Component duplicates found from the ${recipeName} recipe. No component duplicates allowed!`);
									isConfigValid = false;
								}
							}
						}
					}
				}

				if (areaLevel < 1 || areaLevel > 3) {
					logger.logError(`Please indicate a valid level (1-3) for the given hideout area. AreaLevel value (${areaLevel}) from the ${recipeName} recipe is invalid!`);
					isConfigValid = false;
				}

				if (productionTime < 1) {
					logger.logError(`ProductionTime number must not be less than 1. This value (${productionTime}) from the ${recipeName} recipe is invalid!`);
					isConfigValid = false;
				}

				if (!endProduct) {
					logger.logError(`No fields for a recipe can be blank! EndProduct field in the ${recipeName} recipe is found blank.`);
					isConfigValid = false;
				} else if (!validationData.includes(endProduct)) {
					logger.logError(`EndProduct item ID (${endProduct}) from the ${recipeName} recipe is invalid. Please double check.`);
					isConfigValid = false;
				}

				if (receiveHowMany < 1) {
					logger.logError(`ReceiveHowMany number must not be less than 1. This value (${receiveHowMany}) from the ${recipeName} recipe is invalid!`);
					isConfigValid = false;
				}
			}

		return isConfigValid;
	}

	function createCraftingRecipes() {
		let templateData; 

		for (let x = 0; x < configSize; x++) {
			const recipeName = config[x].RecipeName;
			const hideoutArea = config[x].HideoutArea.toLowerCase().replace(/\s/g,'');
			const components = config[x].Requirements.Components;
			const areaLevel = config[x].Requirements.AreaLevel;
			const productionTime = config[x].ProductConfiguration.ProductionTime;
			const endProduct = config[x].ProductConfiguration.EndProduct.replace(/\s/g,'');
			const receiveHowMany = config[x].ProductConfiguration.ReceiveHowMany;

			templateData = global.fileIO.readParsed(templateFile);
			
			for (let i = 0; i < components.length; i++) {
				const component = components[i].split(":");
				const componentItem = component[0].replace(/\s/g,'');
				const componentCount = Math.trunc(component[1].replace(/\s/g,''));

				const componentTemplate = { "templateId": componentItem, "count": componentCount, "isFunctional": false, "type": "Item" }
				const areaTemplate = { "areaType": ModAreas[hideoutArea], "requiredLevel": areaLevel, "type": "Area" }

				if (i == 0) {
					templateData.requirements = [ areaTemplate, componentTemplate ];
					continue;
				}

				templateData.requirements.push(componentTemplate);
			}
			
			templateData._id = recipeName;
			templateData.areaType = ModAreas[hideoutArea];
			templateData.productionTime = productionTime;
			templateData.endProduct = endProduct;
			templateData.count = receiveHowMany;

			newRec.data.push(templateData);
			
			fs.writeFile(recipesDir + recipeName + ".json", JSON.stringify(templateData, null, 2), function (err) {
				if (err) throw err;
				logger.logInfo("Created the " + recipeName + ".json recipe file!");
			});
		}

		fs.readdir(recipesDir, { withFileTypes: true }, (err, dirents) => {
			if (err) return logger.logError("Could not read files from the directory");

			const items = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name);

			items.forEach(function (item) {
				let doesRecipeExist = false;
				
				for (let x = 0; x < configSize; x++) {
					if (item == (config[x].RecipeName + ".json")) {
						doesRecipeExist = true;
						logger.logInfo("Found recipe with the same name in config")
					}
				}

				if (!doesRecipeExist) {
					fs.unlink(recipesDir + item, function(err) {
						if (err) throw err;
						logger.logInfo("Removed recipe since it does not exist in the config: " + item);
					})
				}
			});
		});

		fileIO.write(PathResolver('user/cache/hideout_production.json'), newRec, true);

		logger.logSuccess("[MOD] Hideout Crafting Expanded by Chubs Applied");
	}
}