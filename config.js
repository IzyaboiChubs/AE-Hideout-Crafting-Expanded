
    /* 
        Take note of the following instructions for each type of field:
            * String            - Accepts letters and numbers. Enclose input in double quotes ("").
            * List of String    - Accepts letters and numbers. Enclose input in double quotes ("") and add a comma (,) at the end except for the last one in the list.
            * Integer           - Accepts numbers only. Do not enclose in double quotes ("").
    */
   
module.exports =  [
    {
        "RecipeName": "ski_mask",                       // (String) Name of the recipe. This will just be used to create the JSON file needed for the recipe. Must be unique otherwise the first instance will just be overridden.
        "HideoutArea": "lavatory",                      // (String) Set what hideout area should this craft be for. Choices (ignores case): [ Lavatory | MedStation | Nutrition Unit | Workbench | Intelligence Center ]
        "Requirements": {               
            "Components": [                             // (List of String) Add components to the recipe. Format is <item_id>:<how_many_and_must_not_be_0>
                "5e2af47786f7746d404f3aaa:1",
                "544fb5454bdc2df8738b456a:1"
            ],
            "AreaLevel": 1                              // (Integer) Set what level the recipe will appear for what is set in the recipe's HideoutArea field. Input must be between 1-3, inclusive.
        },
        "ProductConfiguration": {
            "ProductionTime": 1,                        // (Integer) Set how long, in seconds, it takes to craft the item. Input must be not less than 1.
            "EndProduct": "5ab8f20c86f7745cdb629fb2",   // (String) Set what item this recipe will create.
            "ReceiveHowMany": 1                         // (Integer) Set how many item you will receive after crafting. Input must not be less than 1.
        }
    }
    
    /* As a guide, copy below section if you plan to add additional recipes and paste it in the previous line [DO NOT INCLUDE THIS LINE]
    ,{
        "RecipeName": "",
        "HideoutArea": "",
        "Requirements": {
            "Components": [
                "",
                ""
            ],
            "AreaLevel": 1
        },
        "ProductConfiguration": {
            "ProductionTime": 1,
            "EndProduct": "",
            "ReceiveHowMany": 1 
        }
    }
    [DO NOT INCLUDE THIS LINE] */
]