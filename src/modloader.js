exports.mod = (mod_data) => {
	const ModFolders = mod_data.folders;
	const ModTemplates = mod_data.templates;
	const fs = require("fs");
	const path = require("path");
	const config = require("../config.js");
	const configSize = Object.keys(config).length;
	const dbFiles = path.join(__dirname, "../../../../db/items/");
	const modFiles = path.join(__dirname, "../", ModFolders[0]);
	const modDBFile = path.join(__dirname, "../", ModFolders[1]);
	const PathResolver = global.internal.path.resolve;
	let newRec = global.fileIO.readParsed(PathResolver('user/cache/hideout_production.json'));

	setupValidationDB();
	if (validateConfig()) {
		createCraftingRecipes();
	} else {
		logger.logError("[MOD] Hideout Crafting Expanded by Chubs encountered errors! Mod was not applied...");
	}

	function setupValidationDB() {
		let itemIDs = [];

		fs.readdir(dbFiles, { withFileTypes: true }, (err, dirents) => {
			if (err) throw err;
			
			const dbItems = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name);

			dbItems.forEach(function (dbItem) {
				let data = global.fileIO.readParsed(dbFiles + dbItem);

				data.forEach(function (item) {
					itemIDs.push(item._id);
				});
			});

			fs.writeFile(modDBFile + "itemsDB.json", JSON.stringify(itemIDs, null, 2), function(err) {
				if (err) throw err;
				logger.logInfo("Item DB for validation has been setup.");
			});
		});
	}

	function validateConfig() {
		let validationDB = global.fileIO.readParsed(modDBFile + "itemsDB.json");
		let isConfigValid = true;

		for (let x = 0; x < configSize; x++) {
			let endProduct = config[x].ProductConfiguration.EndProduct.replace(/\s/g,'');
			let componentItems = [];
			let isProductItemIDValid = false;

			if (config[x].RecipeName == "") {
				logger.logError("RecipeName from the " + x + "(st|nd|rd|th) recipe is blank. This field must not be blank.");
				isConfigValid = false;
				break;
			}

			if (config[x].HideoutArea.toLowerCase() != "workbench" &&  config[x].HideoutArea.toLowerCase() != "medstation"
			&& config[x].HideoutArea.toLowerCase() != "lavatory") {
				logger.logError("HideoutArea value (" + config[x].HideoutArea + ") from the " + config[x].RecipeName + " recipe is not recognized. Valid inputs are [workbench, lavatory, medstation].");
				isConfigValid = false;
			}

			for (let i = 0; i < config[x].Requirements.Components.length; i++) {
				const componentConfig = config[x].Requirements.Components[i].split(":");
				const componentItem = componentConfig[0].replace(/\s/g,'');
				const componentCount = componentConfig[1].replace(/\s/g,'');
				let isComponentItemIDValid = false;
				
				for (let j = 0; j < validationDB.length; j++) {
					if (componentItem == validationDB[j]) {
						isComponentItemIDValid = true;
						continue;
					}
				}

				if (!isComponentItemIDValid) {
					logger.logError("Component item ID (" + componentItem + ") from the " + config[x].RecipeName + " recipe is invalid. Please double check.");
					isConfigValid = false;
				}

				if (componentCount < 1) {
					logger.logError("Please input a number greater than 0 for how many of the component is needed for the crafting recipe. Component count value (" + componentCount + ") for " + componentItem + " from the " + config[x].RecipeName + " recipe is invalid!");
					isConfigValid = false;
				}

				componentItems.push(componentItem);
			}

			const validatorArray = componentItems.sort();

			for (let y = 0; y < validatorArray.length; y++) {
				if (validatorArray[y + 1] === validatorArray[y]) {
					logger.logError("Component duplicates found from the " + config[x].RecipeName + " recipe. No component duplicates allowed!");
					isConfigValid = false;
				}
			}

			if (config[x].Requirements.Components.length < 1) {
				logger.logError("Components for the " + config[x].RecipeName + " recipe must be defined!");
				isConfigValid = false;
			}

			if (config[x].Requirements.AreaLevel < 1 || config[x].Requirements.AreaLevel > 3) {
				logger.logError("Please indicate a valid level (1-3) for the given hideout area. AreaLevel value (" + config[x].Requirements.AreaLevel + ") from the " + config[x].RecipeName + " recipe is invalid!");
				isConfigValid = false;
			}

			if (config[x].ProductConfiguration.ProductionTime < 1) {
				logger.logError("ProductionTime number must not be less than 1. This value (" + config[x].ProductConfiguration.ProductionTime + ") from the " + config[x].RecipeName + " recipe is invalid!");
				isConfigValid = false;
			}

			for (let y = 0; y < validationDB.length; y++) {
				if (endProduct == validationDB[y]) {
					isProductItemIDValid = true;
					continue;
				}
			}

			if (!isProductItemIDValid) {
				logger.logError("EndProduct item ID (" + endProduct + ") from the " + config[x].RecipeName + " recipe is invalid. Please double check.");
				isConfigValid = false;
			}

			if (config[x].ProductConfiguration.ReceiveHowMany < 1) {
				logger.logError("ReceiveHowMany number must not be less than 1. This value (" + config[x].ProductConfiguration.ReceiveHowMany + ") from the " + config[x].RecipeName + " recipe is invalid!");
				isConfigValid = false;
			}
		}

		return isConfigValid;
	}

	function createCraftingRecipes() {
		let templateData; 

		for (let x = 0; x < configSize; x++) {
			templateData = global.fileIO.readParsed(path.join(__dirname, "../", ModTemplates[config[x].HideoutArea.toLowerCase()]));
			
			for (let i = 0; i < config[x].Requirements.Components.length; i++) {
				const componentConfig = config[x].Requirements.Components[i].split(":");
				const componentItem = componentConfig[0].replace(/\s/g,'');
				const componentCount = componentConfig[1].replace(/\s/g,'');

				const componentTemplate = { "templateId": componentItem, "count": componentCount, "isFunctional": false, "type": "Item" }
				const areaTemplate = { "areaType": templateData.areaType , "requiredLevel": config[x].Requirements.AreaLevel, "type": "Area" }

				if (i == 0) {
					templateData.requirements = [ areaTemplate, componentTemplate ];
					continue;
				}

				templateData.requirements.push(componentTemplate);
			}
			
			templateData._id = config[x].RecipeName;
			templateData.productionTime = config[x].ProductConfiguration.ProductionTime;
			templateData.endProduct = config[x].ProductConfiguration.EndProduct.replace(/\s/g,'');
			templateData.count = config[x].ProductConfiguration.ReceiveHowMany;

			newRec.data.push(templateData);
			
			fs.writeFile(modFiles + config[x].RecipeName + ".json", JSON.stringify(templateData, null, 2), function (err) {
				if (err) throw err;
				logger.logInfo("Created the " + config[x].RecipeName + ".json recipe file!");
			});
		}

		fs.readdir(modFiles, { withFileTypes: true }, (err, dirents) => {
			if (err) return logger.logError("Could not read files from the directory");

			const items = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name);

			items.forEach(function (item) {
				let doesRecipeExist = false;
				
				for (let y = 0; y < configSize; y++) {
					if (item == (config[y].RecipeName + ".json")) {
						doesRecipeExist = true;
						logger.logInfo("Found recipe with the same name in config")
					}
				}

				if (!doesRecipeExist) {
					fs.unlink(modFiles + item, function(err) {
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