sap.ui.define([
    'jquery.sap.global',
    "sap/dm/dme/podfoundation/controller/PluginViewController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/IconPool",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Table",
    "sap/m/ColumnListItem",
    "sap/m/Column",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/ui/model/FilterOperator",
    'sap/ui/core/BusyIndicator',
    "sap/ui/model/Sorter",
    "sap/ui/core/Fragment",
], function (jQuery, PluginViewController, JSONModel, IconPool, Dialog, Button, mobileLibrary, List, StandardListItem, Text, VBox, HBox, Label, Input, Table, ColumnListItem, Column, MessageToast, Filter, MessageBox, FilterOperator, BusyIndicator, Sorter, Fragment) {
    "use strict";
    var ButtonType = mobileLibrary.ButtonType;
    const FORMATO = "";

    return PluginViewController.extend("serviacero.custom.plugins.zpluginHabilitadosV2.zpluginHabilitadosV2.controller.MainView", {

        onInit: function () {
            PluginViewController.prototype.onInit.apply(this, arguments);
            this._scanTimeout = null;
            this._ultimoScan = null;
            this._oModel = new sap.ui.model.json.JSONModel({
                componentes: [],
                escaneos: []
            });
            this.getView().setModel(this._oModel);
            this._oModel.setProperty("/componentes", []);
            this._oModel.setProperty("/escaneos", []);

            document.addEventListener("click", () => {
                this._focusScanner();
            });

        },




        onAfterRendering: function () {
            this._focusScanner();
            let data = "";
            this.cargarTablaPuesto(data);
            return;
        },

        onBeforeRenderingPlugin: function () {



        },

        isSubscribingToNotifications: function () {

            var bNotificationsEnabled = true;

            return bNotificationsEnabled;
        },


        getCustomNotificationEvents: function (sTopic) {
            //return ["template"];
        },


        getNotificationMessageHandler: function (sTopic) {

            //if (sTopic === "template") {
            //    return this._handleNotificationMessage;
            //}
            return null;
        },

        _handleNotificationMessage: function (oMsg) {

            var sMessage = "Message not found in payload 'message' property";
            if (oMsg && oMsg.parameters && oMsg.parameters.length > 0) {
                for (var i = 0; i < oMsg.parameters.length; i++) {

                    switch (oMsg.parameters[i].name) {
                        case "template":

                            break;
                        case "template2":


                    }



                }
            }

        },


        onExit: function () {
            PluginViewController.prototype.onExit.apply(this, arguments);


        },

        // Lógica de plugin

        _focusScanner: function () {
            const oInput = this.byId("scannerInput");

            if (oInput) {
                setTimeout(() => {
                    oInput.focus();

                    const oDomRef = oInput.getDomRef();
                    if (oDomRef) {
                        oDomRef.focus();
                    }
                }, 100);
            }
        },

        onLiveChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sValue = oEvent.getParameter("value");

            if (this._scanTimeout) {
                clearTimeout(this._scanTimeout);
                this._scanTimeout = null;
            }

            if (sValue.startsWith("!") && sValue.endsWith("!")) {
                this._handleScan(sValue, oInput);
                return;
            }

            this._scanTimeout = setTimeout(() => {
                if (
                    sValue &&
                    sValue.startsWith("!") &&
                    sValue.endsWith("!")
                ) {
                    this._handleScan(sValue, oInput);
                }
            }, 200);
        },

        _handleScan: function (sValue, oInput) {
            if (this._scanTimeout) {
                clearTimeout(this._scanTimeout);
                this._scanTimeout = null;
            }
            const limpio = sValue.trim();
            if (!limpio.startsWith("!") || limpio.length < 3) {
                return;
            }
            const partes = limpio.split("!").filter(Boolean);
            if (partes.length === 3 && limpio.endsWith("!")) {
                const [orden, operacion, valor] = partes;
                const operacionFormateada = operacion.padStart(4, "0");
                if (/^\d+$/.test(valor)) {
                    this._ultimoScan = {
                        tipo: "PLANO",
                        orden,
                        operacion: operacionFormateada,
                        plano: valor
                    };
                    this._procesarScanOrden({
                        orden,
                        operacion: operacionFormateada,
                        plano: valor
                    });
                } else {
                    this._ultimoScan = {
                        tipo: "FIGURA",
                        orden,
                        operacion: operacionFormateada,
                        figura: valor
                    };
                    this._procesarScanFigura({
                        orden,
                        operacion: operacionFormateada,
                        figura: valor
                    });
                }
            } else if (partes.length === 1 && limpio.endsWith("!")) {
                const [puesto] = partes;
                this._procesarScanPuesto({
                    puesto
                });
            } else {
                console.warn("Scan inválido o no reconocido:", limpio);
            }
            oInput.setValue("");
            this._focusScanner();
        },
        onScanSubmit: function (oEvent) {
            const oInput = oEvent.getSource();
            const sValue = oEvent.getParameter("value");

            if (this._scanTimeout) {
                clearTimeout(this._scanTimeout);
                this._scanTimeout = null;
            }

            if (
                sValue &&
                sValue.startsWith("!") &&
                sValue.endsWith("!")
            ) {
                this._handleScan(sValue, oInput);
            }
        },

        _procesarScanOrden: function (data) {
            this.cargarTabla(data);
        },
        _procesarScanPuesto: function (data) {
            this.procesarPlano(data);
        },
        _procesarScanFigura: function (data) {
            this.cargarTablaFig(data);
        },

        cargarTabla: function (data, fnCallback) {
            var oThis = this;
            let mandante = this.getConfiguration().Mandante;
            let planta = this.getPodController().getUserPlant();
            let operacion = data.operacion;
            let format = FORMATO;
            let noPlano = data.plano;
            let orden = data.orden;
            const oView = this.getView(),
                oItems = { ITEMS: [] };
            var oTable = oView.byId("HABILITADOS_TABLE");
            var oSwitch = oView.byId("swicthMultiplePlanes");
            var bAcumular = oSwitch && oSwitch.getState();

            var requestJSON = {
                "inFigura": "",
                "inFormat": format,
                "inOperacion": operacion,
                "inPosicion": "",
                "inProyecto": "",
                "inSapClient": mandante,
                "inMaterial": "",
                "inCentro": planta,
                "inNoPlano": noPlano,
                "inOrden": orden
            };

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_1c7d115d-62e9-4c5e-bbaa-c944e7d99e56&async=false";
            try {
                oTable.setBusy(true);
                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        if (oResponseData.outData.value !== undefined) {
                            var nuevosItems = oResponseData.outData.value.map(function (item) {
                                var plan = Number(item.CantidadPlan) || 0;
                                var buena = Number(item.CantidadBuena) || 0;
                                return Object.assign({}, item, {
                                    cantidadPendiente: plan - buena,
                                    cantidadNotificar: (plan - buena) === 1 ? 1 : 0
                                });
                            });

                            if (bAcumular) {
                                var oModelActual = oTable.getModel();
                                var itemsActuales = (oModelActual && oModelActual.getProperty("/ITEMS")) || [];

                                var oTextoOperacion = oView.byId("operacion");
                                var sOperacionActual = oTextoOperacion && oTextoOperacion.getText();

                                if (sOperacionActual && sOperacionActual.trim() !== "" && sOperacionActual !== operacion) {
                                    MessageToast.show("La operación escaneada (" + operacion + ") no coincide con la operación actual (" + sOperacionActual + ")");
                                    oTable.setBusy(false);
                                    fnCallback && fnCallback();
                                    return;
                                }

                                oItems.ITEMS = itemsActuales.concat(nuevosItems);
                            } else {
                                oItems.ITEMS = nuevosItems;
                            }

                            oTable.setModel(new sap.ui.model.json.JSONModel(oItems));
                            oThis.ordenarTabla();
                            oThis.generarResumen(oItems.ITEMS);
                        } else {
                            MessageToast.show(oThis.getView().getModel("i18n").getResourceBundle().getText("mensajeGetSinDatos"));
                            if (!bAcumular) {
                                oTable.setModel(new sap.ui.model.json.JSONModel({ ITEMS: [] }));
                            }
                        }
                        oTable.setBusy(false);
                        fnCallback && fnCallback();
                    },
                    function (oError, sHttpErrorMessage) {
                        oTable.setBusy(false);
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                        fnCallback && fnCallback();
                    })
            } catch (error) {
                oTable.setBusy(false);
                MessageBox.error(oThis.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
                fnCallback && fnCallback();
            }
        },
        cargarTablaFig: function (data) {
            var oThis = this;
            let mandante = this.getConfiguration().Mandante;
            let planta = this.getPodController().getUserPlant();
            let operacion = data.operacion;
            let format = FORMATO;
            let figura = data.figura;
            let orden = data.orden;
            const oView = this.getView(),
                oItems = { ITEMS: [] };
            var oTable = oView.byId("HABILITADOS_TABLE");
            var requestJSON = {
                "inFigura": figura,
                "inFormat": format,
                "inOperacion": operacion,
                "inPosicion": "",
                "inProyecto": "",
                "inSapClient": mandante,
                "inMaterial": "",
                "inCentro": planta,
                "inNoPlano": "",
                "inOrden": orden
            };

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_1c7d115d-62e9-4c5e-bbaa-c944e7d99e56&async=false";
            try {
                oTable.setBusy(true);
                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        var oModel = new sap.ui.model.json.JSONModel();
                        if (oResponseData.outData.value !== undefined) {
                            oItems.ITEMS = oResponseData.outData.value.map(function (item) {

                                var plan = Number(item.CantidadPlan) || 0;
                                var buena = Number(item.CantidadBuena) || 0;

                                return Object.assign({}, item, {
                                    cantidadPendiente: plan - buena,
                                    cantidadNotificar: 0
                                });

                            });

                            oTable.setModel(new sap.ui.model.json.JSONModel(oItems));
                            oThis.ordenarTabla();
                            oThis.generarResumen(oResponseData.outData.value);
                        } else {
                            MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("mensajeGetSinDatos"));
                            oTable.setModel(new sap.ui.model.json.JSONModel({ ITEMS: [] }));
                        }
                        oTable.setBusy(false);
                    },
                    function (oError, sHttpErrorMessage) {
                        oTable.setBusy(false);
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                    })
            } catch (error) {
                oTable.setBusy(false);
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
            }
        },
        generarResumen: function (aData) {
            var oThis = this;
            let planta = this.getPodController().getUserPlant();
            if (!aData || aData.length === 0) {
                return;
            }
            let orden = aData[0].Orden
            var hoy = new Date();
            var oResumen = {
                Proyecto: aData[0].Proyecto,
                Operacion: aData[0].Operacion,
                Orden: aData[0].Orden
            };
            var oProyectoUnico = {};
            var oOperacionUnico = {};
            var oOrdenUnico = {};
            aData.forEach(function (item) {
                if (item.Operacion) {
                    oProyectoUnico[item.Operacion] = true;
                }
                if (item.Proyecto) {
                    oOperacionUnico[item.Proyecto] = true;
                }
                if (item.Orden) {
                    oOrdenUnico[item.Orden] = true;
                }
            });
            if(oResumen.Operacion != "0010"){
                this.byId("swicthMultiplePlanes").setState(false);
            };
            oResumen.Puestos = Object.keys(oProyectoUnico).join(", ");
            oResumen.Puestos = Object.keys(oOperacionUnico).join(", ");
            oResumen.Puestos = Object.keys(oOrdenUnico).join(", ");
            var oModelResumen = new sap.ui.model.json.JSONModel(oResumen);
            this.getView().setModel(oModelResumen, "resumen");
            let requestJSON = {
                "plant": planta,
                "order": orden
            };
            let url = this.getPublicApiRestDataSourceUri() + "order/v1/orders?async=false";
            this.ajaxGetRequest(url, requestJSON,
                function (oResponseData) {
                    oThis.byId("sfc").setText(oResponseData.sfcs[0]);
                    var ordenPadre = oResponseData.customValues.find(function (item) {
                        return item.attribute === "ORDEN_PADRE";
                    });
                    oThis.byId("ordenPadre").setText(ordenPadre ? Number(ordenPadre.value) : "");
                },
                function (oError, sHttpErrorMessage) {
                    var err = oError || sHttpErrorMessage;
                    MessageToast.show(err);
                })
        },
        cargarTablaPuesto: function (data) {
            let mandante = this.getConfiguration().Mandante;
            let planta = this.getPodController().getUserPlant();
            let usuario = this.getPodController().getUserId();
            let workCenter = data.puesto;
            const oView = this.getView(),
                oItems = { puestos: [] };
            var oTable = oView.byId("HABILITADOS_TABLE_PUESTO");
            var requestJSON = {
                "inPlanta": planta,
                "inUsuario": usuario,
                "inPuesto": workCenter,
                "inMandante": mandante
            };

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_453fdfa5-f391-44e1-b974-fd42e58d93d1&async=false";
            try {
                oTable.setBusy(true);
                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        if (oResponseData.outJson !== undefined) {
                            let raw = oResponseData.outJson.trim();
                            if (!raw.startsWith("[")) {
                                raw = "[" + raw + "]";
                            }
                            let data = JSON.parse(raw);
                            data.forEach(function (item) {
                                if (item.usuario && item.usuario.includes("!")) {
                                    let parts = item.usuario.split("!");
                                    item.usuario = parts[0] + " " + parts[1];
                                    item.userId = parts[2] || "";
                                    item.userBatch = parts[3] || "";
                                } else {
                                    item.userId = "";
                                    item.userBatch = "";
                                }

                            });
                            oItems.puestos = data;

                            oTable.setModel(new sap.ui.model.json.JSONModel(oItems));
                        } else {
                            MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("mensajeGetSinDatos"));
                            oTable.setModel(new sap.ui.model.json.JSONModel({ puestos: [] }));
                        }
                        oTable.setBusy(false);
                    },
                    function (oError, sHttpErrorMessage) {
                        oTable.setBusy(false);
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                    })
            } catch (error) {
                oTable.setBusy(false);
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
            }
        },
        ordenarTabla: function () {
            var oTable = this.byId("HABILITADOS_TABLE");
            var oBinding = oTable.getBinding("items"); // Get the items binding
            var bDescending = false; // Set to true for descending sort
            var oCustomSorter = new Sorter("Status", bDescending, false, this.customSorter);
            oBinding.sort([oCustomSorter]);
        },
        onSumar: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            let value = oContext.getProperty("cantidadNotificar") || 0;
            let cantNoti = oContext.getProperty("cantidadNotificada") || 0;
            let cantTotal = oContext.getProperty("cantidadTotal") || 0;
            oContext.getModel().setProperty(oContext.getPath() + "/cantidadNotificar", value + 1);
        },

        onRestar: function (oEvent) {

            const oContext = oEvent.getSource().getBindingContext();
            const oModel = oContext.getModel();
            const sPath = oContext.getPath();

            let pendiente = oModel.getProperty(sPath + "/cantidadNotificar");

            if (pendiente > 0) {
                oModel.setProperty(sPath + "/cantidadNotificar", pendiente - 1);
            }
        },
        procesarPlano: function (data) {
            var inPuesto = data.puesto;
            var oView = this.getView();
            var oTable = oView.byId("HABILITADOS_TABLE_PUESTO");
            var oModel = oTable.getModel();
            var aPuestos = oModel.getProperty("/puestos");
            var sPuesto = inPuesto;
            var oMatch = aPuestos.find(function (item) {
                return item.puesto === sPuesto;
            });
            var sEstatus = oMatch ? oMatch.estatus : null;
            let mensaje = "";
            if (sEstatus === "SIN INICIAR") {
                mensaje = "¿Desea iniciar tiempos?"
            } else {
                mensaje = "¿Desea finalizar tiempos?"
            }
            MessageBox.warning(mensaje, {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        if (sEstatus === "SIN INICIAR") {
                            this.IniciarFigura(data);
                        } else {
                            this.ValidaOrden(data);
                        }
                    }
                }.bind(this),
                dependentOn: this.getView()
            });
        },
        ValidaOrden: async function (data) {
            let orden = this.byId("orden").getText();
            let planta = this.getPodController().getUserPlant();
            let sPathOrder =
                "routing/v1/routings/routingSteps";
            let requestJSON = {
                "routing": orden,
                "plant": planta,
                "type": "SHOP_ORDER"
            };
            let url =
                this.getPublicApiRestDataSourceUri() +
                sPathOrder +
                "?async=false";
            this.ajaxGetRequest(
                url,
                requestJSON,
                async function (oResponseData) {
                    let oStep =
                        oResponseData.routingSteps.find(
                            function (item) {
                                return item.workCenter &&
                                    item.workCenter.workCenter ===
                                    data.puesto;
                            }
                        );
                    if (!oStep) {
                        MessageToast.show(
                            "No se encontró un step para el puesto " +
                            data.puesto
                        );
                        return;
                    }
                    let stepId = oStep.stepId;
                    if (
                            stepId.endsWith("0010") ||
                            stepId.endsWith("0020") ||
                            stepId.endsWith("0030")
                        ) {
                        let valido =
                            await this.validarConsumos(
                                orden,
                                planta
                            );
                        if (!valido) {
                            return;
                        }
                    }
                    let operacion =
                        oStep.routingOperation &&
                        oStep.routingOperation
                            .operationActivity &&
                        oStep.routingOperation
                            .operationActivity
                            .operationActivity;
                    this.EnviarFiguras(
                        stepId,
                        operacion,
                        data
                    );
                }.bind(this),
                function (oError, sHttpErrorMessage) {
                    var err =
                        oError || sHttpErrorMessage;
                    MessageToast.show(err);
                }
            );
        },
        validarConsumos: async function (orden, planta) {
            let oTable = this.byId("HABILITADOS_TABLE");
            var oBinding = oTable.getBinding("items");
            var aContexts = oBinding.getContexts();
            var grupos = {};
            aContexts.forEach(function (oContext) {
                var item = oContext.getObject();
                var cantidadPendiente =
                    Number(item.cantidadNotificar || 0);
                var cantidadPlan =
                    Number(item.CantidadPlan || 0);
                var key =
                    item.Figura + "_" + item.NoPlano;
                if (!grupos[key]) {
                    grupos[key] = {
                        Figura: item.Figura,
                        NoPlano: item.NoPlano,
                        CantidadPendiente: 0,
                        CantidadPlan: 0,
                        materiales: {}
                    };
                }
                grupos[key].CantidadPendiente +=
                    cantidadPendiente;
                grupos[key].CantidadPlan +=
                    cantidadPlan;
                for (var i = 1; i <= 15; i++) {
                    var matKey = "Zmatprim" + i;
                    var totKey = "Zmatprim" + i + "tot";
                    var material = item[matKey];
                    var total =
                        Number(item[totKey] || 0);
                    if (
                        material &&
                        material !== "" &&
                        total > 0 &&
                        !grupos[key]
                            .materiales[material]
                    ) {
                        grupos[key]
                            .materiales[material] = total;
                    }
                }
            });
            var resultado = {};
            Object.keys(grupos).forEach(function(key) {
                var grupo = grupos[key];
                var cantidadPendiente =
                    grupo.CantidadPendiente;
                var cantidadPlan =
                    grupo.CantidadPlan;
                Object.keys(grupo.materiales)
                    .forEach(function(material) {
                        var total =
                            grupo.materiales[material];
                        var consumoProximo =
                            (total / cantidadPlan) *
                            cantidadPendiente;
                        if (!resultado[material]) {
                            resultado[material] = {
                                Material: material,
                                consumo_proximo: 0
                            };
                        }
                        resultado[material]
                            .consumo_proximo +=
                            consumoProximo;
                    });
            });
            var salida = [];
            Object.keys(resultado).forEach(function(material) {
                salida.push({
                    Material: material,
                    consumo_proximo: Number(
                        resultado[material]
                            .consumo_proximo
                            .toFixed(3)
                    )
                });
            });
            var sTabla = JSON.stringify(salida);
            let mandante = this.getConfiguration().Mandante;
            var requestJSON = {
                "inMandante": mandante,
                "inOperacion": this.byId("operacion").getText(),
                "inOrden": this.byId("ordenPadre").getText(),
                "inOrderInd": orden,
                "inPlant": planta,
                "inProxConsumo": sTabla
            };
            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_2c0a25e7-20cd-4069-bf97-370bf8bf6f2c&async=false";
            try {
                var oResponseData = await new Promise(
                    function (resolve, reject) {
                        this.ajaxPostRequest(
                            url,
                            requestJSON,
                            function (response) {
                                resolve(response);
                            },
                            function (oError, sHttpErrorMessage) {
                                reject(oError || sHttpErrorMessage);
                            }
                        );
                    }.bind(this)
                );
                var evaluacion =
                    JSON.parse(
                        oResponseData.outEval || "[]"
                    );

                var tieneError = false;
                var mensajes = [];
                for (var i = 0; i < evaluacion.length; i++) {
                    var item = evaluacion[i];
                    if (item.error === true) {
                        tieneError = true;
                        mensajes.push(item.mensaje);
                    }
                }
                if (tieneError) {
                    MessageBox.error(
                        mensajes.join("\n")
                    );
                    return false;
                }
                return true;
            } catch (error) {
                MessageBox.error(error);
                return false;
            }
        },
        EnviarFiguras: function (stepId, operacion, data) {
            let workCenter = data.puesto;
            const oView = this.getView();
            var oTable2 = oView.byId("HABILITADOS_TABLE_PUESTO");
            var oModel2 = oTable2.getModel();
            var aPuestos = oModel2.getProperty("/puestos");
            var sPuesto = workCenter;
            var oMatch = aPuestos.find(function (item) {
                return item.puesto === sPuesto;
            });
            var sEstatus = oMatch ? oMatch.estatus : null;
            var fechaIn = oMatch ? oMatch.inicio : null;
            let usuario = oMatch ? oMatch.userId : "";
            let usuario2 = this.getPodController().getUserId() || "";
            var oThis = this;
            let mandante = this.getConfiguration().Mandante;
            let planta = this.getPodController().getUserPlant();

            var oTable = oView.byId("HABILITADOS_TABLE");
            var oBinding = oTable.getBinding("items");
            var aContexts = oBinding.getContexts();
            var aData = aContexts
                .map(function (oContext) {
                    var item = oContext.getObject();
                    var cantidadPendiente = +item.cantidadNotificar || 0;
                    var cantidadPlan = +item.CantidadPlan || 0;
                    var cantidadBuena = +item.CantidadBuena || 0;

                    var oItemLimpio = { ...item };
                    delete oItemLimpio.cantidadPendiente;
                    delete oItemLimpio.cantidadNotificar;

                    return {
                        ...oItemLimpio,
                        cantidadPendiente: cantidadPendiente,
                        AgregarPosicion: cantidadPendiente < (cantidadPlan - cantidadBuena)
                    };
                })
                .filter(function (item) {
                    return (+item.cantidadPendiente || 0) > 0;
                });

            var sTabla = JSON.stringify(aData);
            var requestJSON = {
                "inEstatus": sEstatus,
                "inPuesto": workCenter,
                "inFechaActual": this.obtenerFechaActual(),
                "inFechaInicio": fechaIn,
                "inTabla": sTabla,
                "inPlanta": planta,
                "inUsuarioT": usuario,
                "inUsuario": usuario2,
                "inUsuarioN": usuario2,
                "inMandante": mandante,
                "inSfc": this.byId("sfc").getText(),
                "inOrden": this.byId("orden").getText(),
                "inOperacion": operacion,
                "inStepId": stepId,
            };

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_c23cad3a-f573-4385-9145-32f23cf32a1b&async=false";

            try {

                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        let data = "";
                        oThis.cargarTablaPuesto(data);

                        if (oThis._ultimoScan) {
                            if (oThis._ultimoScan.tipo === "PLANO") {
                                var oSwitchMultiple = oView.byId("swicthMultiplePlanes");
                                var bMultiple = oSwitchMultiple && oSwitchMultiple.getState();

                                if (bMultiple) {
                                    var oModelTabla = oTable.getModel();
                                    var aItemsTabla = (oModelTabla && oModelTabla.getProperty("/ITEMS")) || [];
                                    var aPlanos = aItemsTabla
                                        .map(function (item) { return item.NoPlano; })
                                        .filter(function (sPlano, index, self) {
                                            return sPlano !== undefined && sPlano !== null && self.indexOf(sPlano) === index;
                                        });

                                    oTable.setModel(new sap.ui.model.json.JSONModel({ ITEMS: [] }));
                                    var iIndex = 0;
                                    var procesarSiguientePlano = function () {
                                        if (iIndex >= aPlanos.length) {
                                            return;
                                        }
                                        var sPlanoActual = aPlanos[iIndex];
                                        iIndex++;
                                        oThis.cargarTabla({
                                            orden: oThis._ultimoScan.orden,
                                            operacion: oThis._ultimoScan.operacion,
                                            plano: sPlanoActual
                                        }, procesarSiguientePlano);
                                    };
                                    procesarSiguientePlano();
                                } else {
                                    oThis.cargarTabla(oThis._ultimoScan);
                                }
                            } else if (oThis._ultimoScan.tipo === "FIGURA") {
                                oThis.cargarTablaFig(oThis._ultimoScan);
                            }
                        }
                        MessageToast.show(oResponseData.outMessage || "Se enviaron los tiempos correctamente");
                    },
                    function (oError, sHttpErrorMessage) {
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                    });

            } catch (error) {
                oTable.setBusy(false);
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
            }
        },
        IniciarFigura: function (data) {
            let workCenter = data.puesto;
            const oView = this.getView();
            var oTable2 = oView.byId("HABILITADOS_TABLE_PUESTO");
            var oModel2 = oTable2.getModel();
            var aPuestos = oModel2.getProperty("/puestos");
            var sPuesto = workCenter;
            var oMatch = aPuestos.find(function (item) {
                return item.puesto === sPuesto;
            });
            var sEstatus = oMatch ? oMatch.estatus : null;
            var oThis = this;
            let planta = this.getPodController().getUserPlant();

            var requestJSON = {
                "inEstatus": sEstatus,
                "inPuesto": workCenter,
                "inFechaActual": this.obtenerFechaActual(),
                "inPlanta": planta,
            };

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_c23cad3a-f573-4385-9145-32f23cf32a1b&async=false";

            try {

                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        let data = "";
                        oThis.cargarTablaPuesto(data);
                        var oTable = oThis.byId("HABILITADOS_TABLE");
                        oTable.setModel(
                            new sap.ui.model.json.JSONModel({
                                ITEMS: []
                            })
                        );
                        var oModelResumen = oThis.getView().getModel("resumen");
                        if (oModelResumen) {
                            oModelResumen.setData({});
                        }
                        MessageToast.show(oResponseData.outMessage || "Se iniciaron los tiempos correctamente");
                    },
                    function (oError, sHttpErrorMessage) {
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                    });

            } catch (error) {
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
            }
        },
        obtenerFechaActual: function () {
            var now = new Date();
            //var offsetMin = now.getTimezoneOffset(); // minutos respecto a UTC
            var offsetMin = 0;
            now = new Date(now.getTime() - offsetMin * 60000);

            var dia = String(now.getDate()).padStart(2, '0');
            var mes = String(now.getMonth() + 1).padStart(2, '0');
            var anio = now.getFullYear();
            var hora = String(now.getHours()).padStart(2, '0');
            var minuto = String(now.getMinutes()).padStart(2, '0');
            var segundo = String(now.getSeconds()).padStart(2, '0');

            //var fechaLocal = `${dia}-${mes}-${año} ${hora}:${minuto}:${segundo}`;
            var fechaLocal = anio + "." + mes + "." + dia + " " + hora + ":" + minuto + ":" + segundo;
            return fechaLocal;
        },
        logSession: function () {
            let workCenter = this.byId("inpPuesto").getValue().replace(/!/g, "").trim();
            let scanUser = this.byId("inpUsuario").getValue();
            const oView = this.getView();
            let planta = this.getPodController().getUserPlant();
            var oTable2 = oView.byId("HABILITADOS_TABLE_PUESTO");
            var oModel2 = oTable2.getModel();
            var aPuestos = oModel2.getProperty("/puestos");
            var sPuesto = workCenter;
            var oMatch = aPuestos.find(function (item) {
                return item.puesto === sPuesto;
            });
            var user = oMatch ? oMatch.usuario : null;
            var oThis = this;

            var requestJSON = {
                "inPuesto": workCenter,
                "inUser": scanUser,
                "inPlanta": planta,
                "isLogIn": !user
            };

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_497a89d1-d778-437f-9769-2c315bcc282f&async=false";

            try {

                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        let data = "";
                        oThis.cargarTablaPuesto(data);
                        MessageToast.show(oResponseData.outMessage || "Sesión registrada correctamente");
                    },
                    function (oError, sHttpErrorMessage) {
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                    });

            } catch (error) {
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
            }
        },
        scanLog: function () {
            var oView = this.getView();
            var oTable = oView.byId("HABILITADOS_TABLE_PUESTO");
            var oModel = oTable.getModel();
            var oItems = oModel.getProperty("/puestos");
            if (!this.oDefaultDialog) {
                this.oStepText = new sap.m.Text({
                    text: "Escanee el puesto de trabajo"
                });
                this.oInpPuesto = new sap.m.Input(this.createId("inpPuesto"), {
                width: "100%",
                placeholder: "Escanee puesto",
                liveChange: function (oEvent) {
                    let sRaw = oEvent.getParameter("value");

                    if (!/^!.+!$/.test(sRaw)) {
                        return;
                    }

                    let sPuesto = sRaw.replace(/!/g, "").trim();

                    let oMatch = oItems.find(function (item) {
                        return item.puesto === sPuesto;
                    });

                    if (!oMatch) {
                        sap.m.MessageToast.show("Puesto no encontrado");
                        this.oInpPuesto.setValue("");
                        return;
                    }

                    this._selectedPuesto = oMatch;
                    this.oStepText.setText("Escanee el usuario");
                    this.oInpUsuario.setEnabled(true);

                    setTimeout(function () {
                        this.oInpUsuario.focus();
                    }.bind(this), 300);
                }.bind(this),
                submit: function () {
                    let sPuesto = this.oInpPuesto
                        .getValue()
                        .replace(/!/g, "")
                        .trim();
                    let oMatch = oItems.find(function (item) {
                        return item.puesto === sPuesto;
                    });
                    if (!oMatch) {
                        sap.m.MessageToast.show("Puesto no encontrado");
                        return;
                    }
                    this._selectedPuesto = oMatch;
                    this.oStepText.setText("Escanee el usuario");
                    this.oInpUsuario.setEnabled(true);

                    setTimeout(function () {
                        this.oInpUsuario.focus();
                    }.bind(this), 300);
                }.bind(this)
            });

                this.oInpUsuario = new sap.m.Input(this.createId("inpUsuario"), {
                    width: "100%",
                    enabled: false,
                    placeholder: "Escanee usuario"
                });

                this.oDefaultDialog = new sap.m.Dialog({
                    title: "Escaneo para registro de sesión",
                    content: new sap.m.VBox({
                        alignItems: "Stretch",
                        class: "sapUiSmallMargin",
                        items: [
                            this.oStepText,
                            new sap.m.Label({
                                text: "Puesto"
                            }),
                            this.oInpPuesto,
                            new sap.m.Label({
                                text: "Usuario"
                            }),
                            this.oInpUsuario
                        ]
                    }),
                    beginButton: new sap.m.Button({
                        text: "Registrar",
                        type: "Emphasized",
                        press: function () {
                            let scanUser = this.oInpUsuario.getValue();
                            if (!this._selectedPuesto) {
                                sap.m.MessageToast.show("Debe escanear un puesto");
                                return;
                            }
                            let scannedBatch = scanUser.trim();
                            let currentBatch = this._selectedPuesto.userBatch || "";
                            // VALIDACIÓN
                            if (
                                currentBatch &&
                                currentBatch !== scannedBatch
                            ) {
                                sap.m.MessageBox.error(
                                    "El usuario escaneado no corresponde al batch registrado"
                                );
                                return;
                            }
                            this.logSession();
                            this.oDefaultDialog.close();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancelar",
                        press: function () {
                            this.oDefaultDialog.close();
                        }.bind(this)
                    })
                });
                oView.addDependent(this.oDefaultDialog);
            }
            // reset visual
            this.oInpPuesto.setValue("");
            this.oInpUsuario.setValue("");
            this.oInpUsuario.setEnabled(false);
            this.oStepText.setText("Escanee el puesto de trabajo");
            this._selectedPuesto = null;
            this.oDefaultDialog.open();
        },

        // Logica Fragment Escaneo
        AbreConsumos: async function () {
            var order = this.byId("ordenPadre").getText();
            if (!order) {
                MessageToast.show("No hay orden seleccionada");
                return;
            }
            if (!this._oDialogConsumos) {
                this._oDialogConsumos = await Fragment.load({
                    id: this.getView().getId(),
                    name: "serviacero.custom.plugins.zpluginHabilitadosV2.zpluginHabilitadosV2.fragments.Consumos",
                    controller: this
                });
                this.getView().addDependent(this._oDialogConsumos);
                this._oDialogConsumos.setModel(this._oModel);
            }
            this._oDialogConsumos.open();
            this.oScanInput = this.byId("scanInputConsumo");
            if (this.oScanInput) {
                this.oScanInput.focus();
            }
            this.onCargarConsumos();
        },
        onCerrarConsumos: function () {
            this._oDialogConsumos.close();
        },
        onScanLiveupdate: function (oEvent) {
            var oThis = this;
            var orden = this.byId("orden").getText() || "1000884";
            var operacion = this.byId("operacionActividad").getText() || "1000884-0-0010";
            var planta = this.getPodController().getUserPlant();          
            var url = this.getPublicApiRestDataSourceUri() +
            "/pe/api/v1/process/processDefinitions/start?key=REG_ea2930be-d3c5-4f09-884e-949542075622&async=false";

            var sValor = (oEvent.getParameter("value") || "")
                .replace(/\r?\n/g, "")
                .trim();
            if (!sValor.includes("!")) {
                return;
            }
            var [sMaterial, sLote] = sValor.split("!");
            var aComponentes = this._oModel.getProperty("/componentes") || [];
            var oComponente = aComponentes.find(function (oItem) {
                return oItem.material === sMaterial;
            });
            let requestJSON = {
                planta: planta,
                orden: orden,
                lote : sLote,
                material : sMaterial,
                operacion : operacion
            };
            if (oComponente) {
            try {

                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        if(oResponseData.outError){
                            MessageBox.error(oResponseData.outMessage || "Error al registrar lote");
                        }else{
                           MessageBox.success(oResponseData.outMessage || "Lote registrado correctamente"); 
                        }
                        oThis.onCargarCv(operacion);
                        oThis.oScanInput.setValue("");
                    },
                    function (oError, sHttpErrorMessage) {
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                    });

            } catch (error) {
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
            }
            } else {
                MessageToast.show("El material no existe en la lista");
            }
        },
        onCargarConsumos: function (oEvent) {
            var orden = this.byId("ordenPadre").getText();
            var operacion = this.byId("operacion").getText();
            var oThis = this;
            let planta = this.getPodController().getUserPlant();
            var publicApiUri = this.getPublicApiRestDataSourceUri();
            let requestJSON = {
                plant: planta,
                order: orden
            };
            let url = publicApiUri + "order/v1/orders?async=false";
            this.ajaxGetRequest(
                url,
                requestJSON,
                function (oOrderData) {
                    let sfc = oOrderData.sfcs?.[0] || "";
                    let bom = oOrderData.bom?.bom || "";
                    let requestJSON2 = {
                        plant: planta,
                        bom: bom,
                        type: "SHOP_ORDER"
                    };
                    oThis.byId("bom").setText(bom);
                    let url2 = publicApiUri + "bom/v1/boms?async=false";
                    oThis.ajaxGetRequest(
                        url2,
                        requestJSON2,
                        function (oBomData) {
                            let oBom = oBomData?.[0] || {};
                            let aComponents = oBom.components || [];
                            let operationSuffix = operacion;
                            let oOperacion = aComponents.find(function (oComp) {
                                let sOperation =
                                    oComp.assemblyOperationActivity?.operationActivity || "";

                                return sOperation.endsWith(operationSuffix);

                            });
                            let operationActivity =
                                oOperacion?.assemblyOperationActivity?.operationActivity || "";
                            oThis.byId("operacionActividad").setText(operationActivity);
                            oThis.onCargarCv(operationActivity);
                            let stepId = "";
                            if (operationActivity) {
                                stepId = operationActivity
                                    .split("-")
                                    .slice(1)
                                    .join("-");
                            }
                            let requestJSON3 = {
                                plant: planta,
                                order: orden,
                                sfc: sfc,
                                operationActivity: operationActivity,
                                stepId: stepId
                            };
                            let url3 =
                                publicApiUri +
                                "processorder/v2/goodsIssue/summary?async=false";
                            oThis.ajaxGetRequest(
                                url3,
                                requestJSON3,

                                function (oGoodsIssueData) {
                                    var aComponentes = aComponents
                                        .filter(function (oComp) {
                                            var sOperation =
                                            oComp.assemblyOperationActivity?.operationActivity || "";
                                            return (
                                                oComp.componentType === "NORMAL" &&
                                                sOperation === operationActivity
                                            );
                                        })
                                        .map(function (oComp) {
                                            var fNecesaria =
                                                Number(oComp.totalQuantity || 0);
                                            return {
                                                material:
                                                    oComp.material?.material || "",
                                                descripcion:
                                                    oComp.material?.description || "",
                                                uom:
                                                    oComp.unitOfMeasure || "",

                                                cantidadNecesaria:
                                                    fNecesaria,
                                                cantidadConsumida: 0,
                                                cantidadEscaneada: 0,
                                                cantidadPendiente:
                                                    fNecesaria
                                            };
                                        });

                                    aComponentes.forEach(function (oItem) {
                                        let aConsumos = oGoodsIssueData.lineItems.filter(function (oCon) {
                                            return (
                                                oCon.materialId?.material === oItem.material &&
                                                oCon.isBomComponent === false
                                            );
                                        });
                                        let fConsumida = aConsumos.reduce(function (sum, oCon) {
                                            return sum + Number(oCon.consumedQuantity?.value || 0);
                                        }, 0);
                                        let bHuboCancelaciones = aConsumos.some(function (oCon) {
                                            return Number(oCon.assembledAndCanceledComponentsCount || 0) > 1;
                                        });
                                        if (bHuboCancelaciones) {
                                            console.warn(
                                                "Posibles cancelaciones detectadas para material " +
                                                oItem.material,
                                                aConsumos
                                            );
                                        }

                                        oItem.cantidadConsumida = fConsumida;

                                        oItem.cantidadPendiente =
                                            oItem.cantidadNecesaria - fConsumida;
                                    });

                                    oThis._oModel.setProperty(
                                        "/componentes",
                                        aComponentes
                                    );
                                    console.log(aComponentes);
                                },
                                function (oError, sHttpErrorMessage) {
                                    var err =
                                        oError || sHttpErrorMessage;
                                    MessageToast.show(err);
                                }
                            );
                        },
                        function (oError, sHttpErrorMessage) {
                            var err =
                                oError || sHttpErrorMessage;
                            MessageToast.show(err);
                        }
                    );
                },
                function (oError, sHttpErrorMessage) {
                var err =
                    oError || sHttpErrorMessage;
                MessageToast.show(err);
                }
            );
        },
        onCargarCv: function (operationActivity) {
            var operacion = this.byId("operacionActividad").getText() || "1000884";
            var oThis = this;
            let planta = this.getPodController().getUserPlant();
            var publicApiUri = this.getPublicApiRestDataSourceUri();
            var hoy = new Date();
            let requestJSON = {
                "plant": planta,
                "operationActivity": operacion
            };
            
            var url = this.getPublicApiRestDataSourceUri() +
            "/pe/api/v1/process/processDefinitions/start?key=REG_5eb450ec-0065-408b-a09b-a4c340666d14&async=false";
                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        if (oResponseData.outJson !== undefined) {
                        let data = JSON.parse(oResponseData.outJson);
                        oThis._oModel.setProperty("/escaneos", data);
                    } else {
                        oThis._oModel.setProperty("/escaneos", []);
                    }
                    },
                    function (oError, sHttpErrorMessage) {
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                    });
        },
        onConsumo: function () {
            var oThis = this;
            var oTable = this.byId("idSlotTable");
            var oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                sap.m.MessageToast.show("Seleccione un registro");
                return;
            }
            var oContext = oSelectedItem.getBindingContext();
            var oData = oContext.getObject();
            var order = this.byId("ordenPadre").getText() || "1000884";
            var operacion = this.byId("operacionActividad").getText();
            var bom = this.byId("bom").getText();
            var oThis = this;
            let usuario = this.getPodController().getUserId();
            let planta = this.getPodController().getUserPlant();
            let workcenter = "";
            if (operacion.endsWith("0010")) {
                workcenter = "CC02";
            } else if (operacion.endsWith("0020")) {
                workcenter = "CO01";
            } else if (operacion.endsWith("0030")) {
                workcenter = "CM01";
            }
            let requestJSON = {
                "Batch": oData.Lote,
                "bom": bom,
                "Cantidad": oData.cantidadAsignada,
                "FechaActual": this.obtenerFechaActualconT(),
                "Material": String(oData.Material).padStart(18, "0"),
                "Order": order,
                "Phase": operacion,
                "Plant": planta,
                "Uom": oData.loteUom,
                "Usuario": usuario,
                "WorkCenter": workcenter
            };
            
            var url = this.getPublicApiRestDataSourceUri() +
            "/pe/api/v1/process/processDefinitions/start?key=REG_a87c5744-3c8d-4781-ac9b-7ec1da958d12&async=false";
                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        oThis.onCargarCv(operacion);
                        oThis.onCargarConsumos();
                         MessageBox.success("Consumo registrado exitosamente");
                    },
                    function (oError, sHttpErrorMessage) {
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(oError.details.message || "Error al registrar consumo");
                    });
        },
        obtenerFechaActualconT: function () {
            var oFecha = new Date();
            var year = oFecha.getFullYear();
            var month = String(oFecha.getMonth() + 1)
                .padStart(2, "0");
            var day = String(oFecha.getDate())
                .padStart(2, "0");
            var hours = String(oFecha.getHours())
                .padStart(2, "0");
            var minutes = String(oFecha.getMinutes())
                .padStart(2, "0");
            var seconds = String(oFecha.getSeconds())
                .padStart(2, "0");
            return (
                year + "-" +
                month + "-" +
                day + "T" +
                hours + ":" +
                minutes + ":" +
                seconds
            );
        },
        GetScrap: function () {
            var oView = this.getView();
            var oTable = oView.byId("HABILITADOS_TABLE");
            var oModel = oTable.getModel();
            var aItems = (oModel && oModel.getProperty("/ITEMS")) || [];

            if (aItems.length === 0) {
                MessageToast.show("Debe escanear primero para poder abrir el Scrap");
                return;
            }

            this._abrirDialogoScrap();
        },

        GetLargoDiverso: function () {
            var oView = this.getView();
            var oTable = oView.byId("HABILITADOS_TABLE");
            var oModel = oTable.getModel();
            var aItems = (oModel && oModel.getProperty("/ITEMS")) || [];

            if (aItems.length === 0) {
                MessageToast.show("Debe escanear primero para poder abrir el Largo Diverso");
                return;
            }

            this._abrirDialogoLargoDiverso();
        },
        _abrirDialogoScrap: function () {
            var oThis = this;
            var oView = this.getView();
            var oTableHabilitados = oView.byId("HABILITADOS_TABLE");
            var oModelHabilitados = oTableHabilitados.getModel();
            var aItemsHabilitados = (oModelHabilitados && oModelHabilitados.getProperty("/ITEMS")) || [];

            var aItemsScrap = aItemsHabilitados.map(function (item) {
                return {
                    NoPlano: item.NoPlano,
                    Figura: item.Figura,
                    cantidadScrap: 0
                };
            });

            var sOrden = oView.byId("orden").getText();
            var sOperacion = oView.byId("operacion").getText();
            var sMaterial = oView.byId("material") ? oView.byId("material").getText() : "";

            var oModelScrap = new JSONModel({
                Orden: sOrden,
                Operacion: sOperacion,
                Material: sMaterial,
                TotalScrap: 0,
                ITEMS: aItemsScrap
            });

            if (!this._oDialogScrap) {
                this._oDialogScrap = new Dialog({
                    title: "Scrap",
                    contentWidth: "40rem",
                    content: [
                        new VBox({
                            class: "sapUiSmallMargin",
                            items: [
                                new HBox({
                                    wrap: "Wrap",
                                    class: "sapUiSmallMarginBottom",
                                    items: [
                                        new VBox({
                                            class: "sapUiMediumMarginEnd",
                                            items: [
                                                new Label({ text: "Orden" }),
                                                new Text({ text: "{scrap>/Orden}" })
                                            ]
                                        }),
                                        new VBox({
                                            class: "sapUiMediumMarginEnd",
                                            items: [
                                                new Label({ text: "Operación" }),
                                                new Text({ text: "{scrap>/Operacion}" })
                                            ]
                                        }),
                                        new VBox({
                                            class: "sapUiMediumMarginEnd",
                                            items: [
                                                new Label({ text: "Material" }),
                                                new Text({ text: "{scrap>/Material}" })
                                            ]
                                        }),
                                        new VBox({
                                            items: [
                                                new Label({ text: "Total Scrap" }).addStyleClass("sapUiTinyMarginTop"),
                                                new Text({ text: "{scrap>/TotalScrap}" }).addStyleClass("sapUiTinyMarginTop")
                                            ]
                                        })
                                    ]
                                }),
                                new Table({
                                    mode: "MultiSelect",
                                    selectionChange: function (oEvent) {
                                        oThis._onSeleccionScrap(oEvent);
                                    },
                                    items: {
                                        path: "scrap>/ITEMS",
                                        template: new ColumnListItem({
                                            cells: [
                                                new Text({ text: "{scrap>NoPlano}" }),
                                                new Text({ text: "{scrap>Figura}" }),
                                                new Input({
                                                    type: "Number",
                                                    value: "{scrap>cantidadScrap}",
                                                    liveChange: function () {
                                                        oThis._recalcularTotalScrap();
                                                    }
                                                })
                                            ]
                                        })
                                    },
                                    columns: [
                                        new Column({ header: new Label({ text: "No. Plano" }) }),
                                        new Column({ header: new Label({ text: "Figura" }) }),
                                        new Column({ header: new Label({ text: "Cantidad Scrap" }) })
                                    ]
                                })
                            ]
                        })
                    ],
                    beginButton: new Button({
                        text: "Enviar movimiento",
                        type: "Emphasized",
                        press: function () {
                            oThis._onGuardarScrap();
                        }
                    }),
                    endButton: new Button({
                        text: "Cerrar",
                        type: "Reject",
                        press: function () {
                            oThis.onCerrarScrap();
                        }
                    })
                });

                this.getView().addDependent(this._oDialogScrap);
            }

            this._oDialogScrap.setModel(oModelScrap, "scrap");
            this._oDialogScrap.open();
        },

        _onSeleccionScrap: function () {
            this._recalcularTotalScrap();
        },

        _recalcularTotalScrap: function () {
            var oModelScrap = this._oDialogScrap.getModel("scrap");
            var oTableScrap = this._oDialogScrap.getContent()[0].getItems()[1];
            var aContextosSeleccionados = oTableScrap.getSelectedContexts();

            var iTotal = aContextosSeleccionados.reduce(function (iSuma, oContext) {
                var item = oContext.getObject();
                return iSuma + (Number(item.cantidadScrap) || 0);
            }, 0);

            oModelScrap.setProperty("/TotalScrap", iTotal);
        },

        onCerrarScrap: function () {
            this._oDialogScrap.close();
        },

        _onGuardarScrap: function () {
            var oModelScrap = this._oDialogScrap.getModel("scrap");
            var aItems = oModelScrap.getProperty("/ITEMS");
            var tipo = "SCRAP";
            this.sendByProduct(tipo);
            this._oDialogScrap.close();
        },

        _abrirDialogoLargoDiverso: function () {
            var oThis = this;

            if (!this._oDialogLargoDiverso) {
                this._oDialogLargoDiverso = new Dialog({
                    title: "Largo Diverso",
                    contentWidth: "30rem",
                    content: [
                        // aquí agregas tus controles
                    ],
                    beginButton: new Button({
                        text: "Enviar movimiento",
                        type: "Emphasized",
                        press: function () {
                            oThis._onGuardarLargoDiverso();
                        }
                    }),
                    endButton: new Button({
                        text: "Cerrar",
                        icon: "sap-icon://nav-back",
                        type: "Reject",
                        press: function () {
                            oThis.onCerrarLargoDiverso();
                        }
                    })
                });

                this.getView().addDependent(this._oDialogLargoDiverso);
            }

            this._oDialogLargoDiverso.open();
        },

        onCerrarLargoDiverso: function () {
            this._oDialogLargoDiverso.close();
        },

        _onGuardarLargoDiverso: function () {
            var tipo = "LARGO";
            this.sendByProduct(tipo);
            this._oDialogLargoDiverso.close();
        },
        
        sendByProduct: function (tipo) {
            MessageToast.show(tipo);
        },
    });
});