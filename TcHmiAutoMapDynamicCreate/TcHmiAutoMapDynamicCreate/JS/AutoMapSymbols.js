// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../Packages/Beckhoff.TwinCAT.HMI.Framework.12.758.8/runtimes/native1.12-tchmi/TcHmi.d.ts" />

(function (/** @type {globalThis.TcHmi} */ TcHmi) {
    // If you want to unregister an event outside the event code you need to use the return value of the method register()
    let destroyOnInitialized = TcHmi.EventProvider.register('onInitialized', (e, data) => {
        // This event will be raised only once, so we can free resources. 
        // It's best practice to use destroy function of the event object within the callback function to avoid conflicts.
        e.destroy();

        if (TcHmi.Server.isWebsocketReady()) {

            //AutoMap symbols to the TcHmiSrv by sending the request
            let request = {
                'requestType': 'ReadWrite',
                'commands': [
                    {
                        "commandOptions": ["SendErrorMessage"],
                        "symbol": "AddSymbols",
                        "writeValue": {
                            "domain": "ADS"
                        }
                    }
                ]
            }

            // Send request to TwinCAT HMI Server.
            TcHmi.Server.requestEx(request, { timeout: 2000 }, async function (data) {
                // Callback handling.
                if (data.error !== TcHmi.Errors.NONE) {
                    // Handle TcHmi.Server class level error here.
                    return;
                }
                var response = data.response;
                if (!response || response.error !== undefined) {
                    // Handle TwinCAT HMI Server response level error here.
                    return;
                }
                var commands = response.commands;
                if (commands === undefined) {
                    return;
                }
                for (var i = 0, ii = commands.length; i < ii; i++) {
                    var command = commands[i];
                    if (command === undefined) {
                        return;
                    }
                    if (command.error !== undefined) {
                        // Handle TwinCAT HMI Server command level error here.
                        return;
                    }
                    // Handle result...
                    TcHmi.Log.debug(command.symbol + '=' + command.readValue);
                }

                //Create UserControls and data-bindings

                //Get Object of auto mapped symbols
                const obj = data.results[0].value;

                //Get the Grid control from Desktop.view
                const gridObjParent = TcHmi.Controls.get("TcHmiGrid");

                //Grid Column object
                const gridColumn = {
                    "width": 1.0,
                    "widthUnit": "factor",
                    "widthMode": "Value",
                    "maxWidthUnit": "px",
                    "minWidthUnit": "px",
                    "overflow": false
                };

                var gridColumnOptions = [];
                var gridIndex = 0;

                var userCtrlPath = "UC/UC_Object.usercontrol";

                //Loop the object and read the property which will contain the symbol expression name
                for (const prop of Object.keys(obj)) {
                    //Create correct data-binding
                    let symExp = "%s%" + prop + "%/s%";

                    //Check that the symbol have the correct data type
                    let dataType = "tchmi:server#/definitions/PLC1.FB_Object";
                    let symType = "";
                    let t = new TcHmi.Symbol(symExp);
                    await t.resolveSchema(function (data) { symType = data.schema.id; });

                    if (symType === dataType) {
                        //Set column for the grid
                        gridColumnOptions.push(gridColumn);
                        gridObjParent.setColumnOptions(gridColumnOptions);

                        // Create unique id for the UserControl as every control should have unique id
                        var userCtrlId = String("UC_" + tchmi_create_guid());

                        //data-tchmi-target-user-control
                        let userCtrl = TcHmi.ControlFactory.createEx(
                            'tchmi-user-control-host',
                            userCtrlId,
                            {
                                'data-tchmi-target-user-control': userCtrlPath,
                                'data-tchmi-top': 5,
                                'data-tchmi-left': 5,
                                'data-tchmi-width': 125,
                                'data-tchmi-height': 100,
                                'data-tchmi-grid-column-index': gridIndex,
                                'data-tchmi-object': symExp
                            },
                            gridObjParent
                        );

                        gridIndex++;
                    }
                }

            });

        }

    });
})(TcHmi);