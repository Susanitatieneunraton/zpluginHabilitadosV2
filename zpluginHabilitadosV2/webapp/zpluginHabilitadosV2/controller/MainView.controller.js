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
    "sap/ui/layout/form/SimpleForm",
    "sap/m/Title",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/ui/model/FilterOperator",
    'sap/ui/core/BusyIndicator',
    "sap/ui/model/Sorter",
    "sap/ui/core/Fragment",
], function (jQuery, PluginViewController, JSONModel, IconPool, Dialog, Button, mobileLibrary, List, StandardListItem, Text, VBox, HBox, Label, Input, Table, ColumnListItem, Column, SimpleForm, Title, MessageToast, Filter, MessageBox, FilterOperator, BusyIndicator, Sorter, Fragment) {
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
                    const oDomRef = oInput.getDomRef("inner") || oInput.getDomRef();
                    if (!oDomRef) {
                        oInput.focus();
                        return;
                    }

                    const bIsTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

                    if (bIsTouchDevice) {
                        oDomRef.setAttribute("inputmode", "none");
                        oDomRef.setAttribute("readonly", "readonly");
                        oDomRef.focus();
                        setTimeout(() => {
                            oDomRef.removeAttribute("readonly");
                        }, 50);
                    } else {
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

            if (!sValue) {
                return;
            }
            this._scanTimeout = setTimeout(() => {
                this._scanTimeout = null;
                if (sValue.startsWith("!") && sValue.endsWith("!")) {
                    this._handleScan(sValue, oInput);
                }
            }, 150);
        },

        _handleScan: function (sValue, oInput) {
            if (this._scanTimeout) {
                clearTimeout(this._scanTimeout);
                this._scanTimeout = null;
            }
            const limpio = sValue.trim();
            if (!limpio.startsWith("!") || limpio.length < 4) {
                return;
            }
            const partes = limpio.split("!").filter(Boolean);
            if (partes.length === 4 && limpio.endsWith("!")) {
                const [proyecto, entrega, operacion, valor] = partes;
                const operacionFormateada = operacion.padStart(4, "0");
                if (/^\d+$/.test(valor)) {
                    this._ultimoScan = {
                        tipo: "PLANO",
                        proyecto,
                        entrega,
                        operacion: operacionFormateada,
                        plano: valor
                    };
                    this._procesarScanOrden({
                        proyecto,
                        entrega,
                        operacion: operacionFormateada,
                        plano: valor
                    });
                } else {
                    this._ultimoScan = {
                        tipo: "FIGURA",
                        proyecto,
                        entrega,
                        operacion: operacionFormateada,
                        figura: valor
                    };
                    this._procesarScanFigura({
                        proyecto,
                        entrega,
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
            let proyecto = data.proyecto;
            let entrega = data.entrega;
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
                "inProyecto": proyecto,
                "inSapClient": mandante,
                "inMaterial": "",
                "inCentro": planta,
                "inNoPlano": noPlano,
                "inOrden": "",
                "inEntrega": entrega
            };

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_2ab27bba-92ae-4df5-8d96-b701d2fbfbfb&async=false";
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
            let proyecto = data.proyecto;
            let entrega = data.entrega;
            const oView = this.getView(),
                oItems = { ITEMS: [] };
            var oTable = oView.byId("HABILITADOS_TABLE");
            var requestJSON = {
                "inFigura": figura,
                "inFormat": format,
                "inOperacion": operacion,
                "inPosicion": "",
                "inProyecto": proyecto,
                "inSapClient": mandante,
                "inMaterial": "",
                "inCentro": planta,
                "inNoPlano": "",
                "inOrden": "",
                "inEntrega": entrega
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
                                            proyecto: oThis._ultimoScan.proyecto,
                                            entrega: oThis._ultimoScan.entrega,
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
                    text: "Escanee el puesto de trabajo",
                    class: "sapUiSmallMargin"
                });
                this.oInpPuesto = new sap.m.Input(this.createId("inpPuesto"), {
                    width: "100%",
                    placeholder: "Escanee puesto",
                    class: "sapUiSmallMargin",
                    liveChange: function (oEvent) {
                        let sRaw = oEvent.getParameter("value");
                        sap.m.MessageToast.show(sRaw);
                        if (!/^!.+!$/.test(sRaw)) return;

                        let sPuesto = sRaw.replace(/!/g, "").trim();
                        let oCurrentItems = oModel.getProperty("/puestos");
                        let oMatch = oCurrentItems.find(function (item) {
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
                        setTimeout(function () { this.oInpUsuario.focus(); }.bind(this), 300);
                }.bind(this),
                submit: function () {
                    let sPuesto = this.oInpPuesto.getValue().replace(/!/g, "").trim();
                    let oCurrentItems = oModel.getProperty("/puestos");
                    let oMatch = oCurrentItems.find(function (item) {
                        return item.puesto === sPuesto;
                    });
                    if (!oMatch) {
                        sap.m.MessageToast.show("Puesto no encontrado");
                        return;
                    }
                    this._selectedPuesto = oMatch;
                    this.oStepText.setText("Escanee el usuario");
                    this.oInpUsuario.setEnabled(true);
                    setTimeout(function () { this.oInpUsuario.focus(); }.bind(this), 300);
                }.bind(this)
            });
                this.oInpPuesto.addEventDelegate({
                    onAfterRendering: function () {
                        this.oInpPuesto.$().find("input").attr("inputmode", "none");
                    }.bind(this)
                });

                this.oInpUsuario = new sap.m.Input(this.createId("inpUsuario"), {
                    width: "100%",
                    enabled: false,
                    placeholder: "Escanee usuario",
                    class: "sapUiSmallMargin"
                });
                this.oInpUsuario.addEventDelegate({
                    onAfterRendering: function () {
                        this.oInpUsuario.$().find("input").attr("inputmode", "none");
                    }.bind(this)
                });

                this.oDefaultDialog = new sap.m.Dialog({
                    title: "Escaneo para registro de sesión",
                    class: "sapUiContentPadding",
                    content: new sap.m.VBox({
                        alignItems: "Stretch",
                        class: "sapUiSmallMargin",
                        items: [
                            this.oStepText,
                            new sap.m.Label({
                                text: "Puesto",
                                class: "sapUiSmallMargin"
                            }),
                            this.oInpPuesto,
                            new sap.m.Label({
                                text: "Usuario",
                                class: "sapUiSmallMargin"
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
            this.oInpUsuario.setEnabled(true);
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
            var sValor = (oEvent.getParameter("value") || "")
                .replace(/\r?\n/g, "")
                .trim();

            if (this._scanLiveTimeout) {
                clearTimeout(this._scanLiveTimeout);
                this._scanLiveTimeout = null;
            }

            if (!sValor.includes("!")) {
                return;
            }

            this._scanLiveTimeout = setTimeout(function () {
                oThis._scanLiveTimeout = null;
                oThis._procesarScanLote(sValor);
            }, 150);
        },

        _procesarScanLote: function (sValor) {
            var oThis = this;
            var orden = this.byId("orden").getText() || "N/A";
            var operacion = this.byId("operacionActividad").getText() || "N/A";
            var planta = this.getPodController().getUserPlant();
            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_ea2930be-d3c5-4f09-884e-949542075622&async=false";

            var [sMaterial, sLote] = sValor.split("!");
            var aComponentes = this._oModel.getProperty("/componentes") || [];
            var oComponente = aComponentes.find(function (oItem) {
                return oItem.material === sMaterial;
            });

            let requestJSON = {
                planta: planta,
                orden: orden,
                lote: sLote,
                material: sMaterial,
                operacion: operacion
            };

            if (oComponente) {
                try {
                    this.ajaxPostRequest(url, requestJSON,
                        function (oResponseData) {
                            if (oResponseData.outError) {
                                MessageBox.error(oResponseData.outMessage || "Error al registrar lote");
                            } else {
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
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
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
                                    var aFiltrados = aComponents.filter(function (oComp) {
                                        var sOperation = oComp.assemblyOperationActivity?.operationActivity || "";
                                        return (
                                            oComp.componentType === "NORMAL" &&
                                            sOperation === operationActivity
                                        );
                                    });

                                    var aComponentes = new Array(aFiltrados.length);
                                    var iPendientes = aFiltrados.length;

                                    if (iPendientes === 0) {
                                        oThis._oModel.setProperty("/componentes", []);
                                        return;
                                    }

                                    aFiltrados.forEach(function (oComp, iIndex) {
                                        var fNecesaria = Number(oComp.totalQuantity || 0);
                                        var sMaterial = oComp.material?.material || "";

                                        oThis.getMaterialInfo(sMaterial, planta, function (oMaterialInfo) {
                                            var sDescripcion =
                                                oMaterialInfo.description || oComp.material?.description || "";
                                            var sUomBase =
                                                oMaterialInfo.unitOfMeasure || oComp.unitOfMeasure || "";

                                            var fCantidadFinal = fNecesaria;
                                            var sUomFinal = sUomBase;

                                            if (sUomBase === "KG") {
                                                var fConvertida = oThis.convertKgToSt(
                                                    fNecesaria,
                                                    oMaterialInfo.alternateUnitsOfMeasure
                                                );
                                                if (fConvertida !== null) {
                                                    // Necesaria: redondeo hacia arriba (no quedarse corto de material)
                                                    fCantidadFinal = Math.ceil(fConvertida);
                                                    sUomFinal = "ST";
                                                }
                                            }

                                            aComponentes[iIndex] = {
                                                material: sMaterial,
                                                descripcion: sDescripcion,
                                                uom: sUomFinal,
                                                uomOriginal: sUomBase,
                                                cantidadNecesaria: fCantidadFinal,
                                                cantidadNecesariaOriginal: fNecesaria,
                                                cantidadConsumida: 0,
                                                cantidadEscaneada: 0,
                                                cantidadPendiente: fCantidadFinal,
                                                // temporal, se usa para convertir cantidadConsumida más abajo
                                                _alternateUnitsOfMeasure: oMaterialInfo.alternateUnitsOfMeasure || []
                                            };

                                            iPendientes--;
                                            if (iPendientes === 0) {
                                                // Ya llegaron TODAS las respuestas de material, ahora sí
                                                // calculamos consumos y actualizamos el modelo
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

                                                    // Consumida: misma conversión, SIN redondeo hacia arriba
                                                    if (oItem.uomOriginal === "KG") {
                                                        var fConsumidaConvertida = oThis.convertKgToSt(
                                                            fConsumida,
                                                            oItem._alternateUnitsOfMeasure
                                                        );
                                                        if (fConsumidaConvertida !== null) {
                                                            fConsumida = fConsumidaConvertida;
                                                        }
                                                    }

                                                    oItem.cantidadConsumida = Math.round(fConsumida * 1000) / 1000;
                                                    oItem.cantidadPendiente =
                                                        Math.round((oItem.cantidadNecesaria - fConsumida) * 1000) / 1000;

                                                    delete oItem._alternateUnitsOfMeasure;
                                                });

                                                oThis._oModel.setProperty("/componentes", aComponentes);
                                                console.log(aComponentes);
                                            }
                                        });
                                    });
                                },
                                function (oError, sHttpErrorMessage) {
                                    var err = oError || sHttpErrorMessage;
                                    MessageToast.show(err);
                                }
                            );
                        },
                        function (oError, sHttpErrorMessage) {
                            var err = oError || sHttpErrorMessage;
                            MessageToast.show(err);
                        }
                    );
                },
                function (oError, sHttpErrorMessage) {
                    var err = oError || sHttpErrorMessage;
                    MessageToast.show(err);
                }
            );
        },

        getMaterialInfo: function (material, planta, fCallback) {
            var oThis = this;
            var publicApiUri = this.getPublicApiRestDataSourceUri();
            var Material = material.padStart(18, "0");
            let requestJSON = {
                plant: planta,
                material: Material
            };
            let url = publicApiUri + "material/v1/materials?async=false";
            this.ajaxGetRequest(
                url,
                requestJSON,
                function (oMaterialData) {
                    var oMat = Array.isArray(oMaterialData)
                        ? (oMaterialData[0] || {})
                        : (oMaterialData || {});
                    fCallback({
                        description: oMat.description || "",
                        unitOfMeasure: oMat.unitOfMeasure || "",
                        alternateUnitsOfMeasure: oMat.alternateUnitsOfMeasure || []
                    });
                },
                function (oError, sHttpErrorMessage) {
                    var err = oError || sHttpErrorMessage;
                    MessageToast.show(err);
                    // Importante: llamar el callback igual con valores vacíos,
                    // para no dejar el flujo colgado si un material falla
                    fCallback({
                        description: "",
                        unitOfMeasure: "",
                        alternateUnitsOfMeasure: []
                    });
                }
            );
        },

        convertKgToSt: function (fCantidadKg, aAlternateUoms) {
            var oAltSt = (aAlternateUoms || []).find(function (oAlt) {
                return oAlt.uom === "ST";
            });
            if (!oAltSt) {
                return null;
            }
            var fNumerador = Number(oAltSt.numerator || 1);
            var fDenominador = Number(oAltSt.denominator || 1);
            if (fDenominador === 0) {
                return null;
            }
            var fResultado = fCantidadKg * (fDenominador / fNumerador);
            return fResultado;
        },

        onCargarCv: function (operationActivity) {
            var operacion = this.byId("operacionActividad").getText() || "1000884";
            var oThis = this;
            let planta = this.getPodController().getUserPlant();
            var publicApiUri = this.getPublicApiRestDataSourceUri();
            let requestJSON = {
                "plant": planta,
                "operationActivity": operacion
            };

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_5eb450ec-0065-408b-a09b-a4c340666d14&async=false";
            this.ajaxPostRequest(url, requestJSON,
                function (oResponseData) {
                    if (oResponseData.outJson === undefined) {
                        oThis._oModel.setProperty("/escaneos", []);
                        return;
                    }

                    let data = JSON.parse(oResponseData.outJson) || [];

                    if (data.length === 0) {
                        oThis._oModel.setProperty("/escaneos", []);
                        return;
                    }

                    var iPendientes = data.length;

                    data.forEach(function (oItem) {
                        var sMaterial = String(oItem.Material || "");
                        var sUom = oItem.loteUom || "";
                        var fCantidad = Number(oItem.loteQty || 0);

                        if (sMaterial && sUom === "KG") {
                            oThis.getMaterialInfo(sMaterial, planta, function (oMaterialInfo) {
                                var fConvertida = oThis.convertKgToSt(
                                    fCantidad,
                                    oMaterialInfo.alternateUnitsOfMeasure
                                );
                                if (fConvertida !== null) {
                                    oItem.loteQty = Math.round(fConvertida * 1000) / 1000;
                                    oItem.loteUom = "ST";
                                }
                                iPendientes--;
                                if (iPendientes === 0) {
                                    oThis._oModel.setProperty("/escaneos", data);
                                }
                            });
                        } else {
                            iPendientes--;
                            if (iPendientes === 0) {
                                oThis._oModel.setProperty("/escaneos", data);
                            }
                        }
                    });
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

        // Logica Fragment Scrap

        GetScrap: async function () {
            var oView = this.getView();
            var oThis = this;
            var oTableHabilitados = this.byId("HABILITADOS_TABLE");
            var oModelHabilitados = oTableHabilitados.getModel();
            var aItemsHabilitados = (oModelHabilitados && oModelHabilitados.getProperty("/ITEMS")) || [];

            if (aItemsHabilitados.length === 0) {
                MessageToast.show("Debe escanear primero para poder abrir el Scrap");
                return;
            }

            var aItemsScrap = aItemsHabilitados.map(function (item) {
                return {
                    NoPlano: item.NoPlano,
                    Figura: item.Figura,
                    CantidadPlan: item.CantidadPlan,
                    CantidadBuena: item.CantidadBuena,
                    status: item.Status,
                    cantidadScrap: item.Zkgscrap,
                    Material: item.Material,
                    Centro: item.Centro,
                    Operacion: item.Operacion,
                    Posicion: item.Posicion,
                    Proyecto: item.Proyecto,
                    Atraso: item.Atraso,
                    Usuario: item.Usuario,
                    CantidadPlan: item.CantidadPlan,
                    fechaFin: item.fechaFin,
                    fechaInicio: item.fechaInicio,
                    FechaNueva: item.FechaNueva,
                    FechaRegistro: item.FechaRegistro,
                    PtoTrabajo: item.PtoTrabajo,
                    Enabled: item.Status == "C" ? true : false,
                };
            });
            aItemsScrap = this._prorratearScrap(aItemsScrap);

            var sOrden = this.byId("ordenPadre").getText();
            var sOperacion = this.byId("operacion").getText();
            let planta = this.getPodController().getUserPlant();
            var publicApiUri = this.getPublicApiRestDataSourceUri();

            var sMaterialScrap = "";

            try {
                let requestJSON = {
                    plant: planta,
                    order: sOrden
                };
                let url = publicApiUri + "order/v1/orders?async=false";

                let oOrderData = await new Promise(function (resolve, reject) {
                    oThis.ajaxGetRequest(url, requestJSON, resolve, reject);
                });

                let bom = oOrderData.bom?.bom || "";
                let requestJSON2 = {
                    plant: planta,
                    bom: bom,
                    type: "SHOP_ORDER"
                };
                let url2 = publicApiUri + "bom/v1/boms?async=false";

                let oBomData = await new Promise(function (resolve, reject) {
                    oThis.ajaxGetRequest(url2, requestJSON2, resolve, reject);
                });

                let oBom = oBomData?.[0] || {};
                let aComponents = oBom.components || [];
                let operationSuffix = sOperacion;
                let oOperacion = aComponents.find(function (oComp) {
                    let sOperation =
                        oComp.assemblyOperationActivity?.operationActivity || "";

                    return sOperation.endsWith(operationSuffix);
                });
                let operationActivity =
                    oOperacion?.assemblyOperationActivity?.operationActivity || "";

                let oComponenteScrap = aComponents.find(function (oComp) {
                    var sOperation =
                        oComp.assemblyOperationActivity?.operationActivity || "";

                    return (
                        oComp.componentType === "BY_PRODUCT" &&
                        oComp.unitOfMeasure === "KG" &&
                        sOperation === operationActivity
                    );
                });

                sMaterialScrap = oComponenteScrap?.material?.material || "";
                console.log(sMaterialScrap);

            } catch (oError) {
                var err = oError?.message || oError;
                MessageToast.show(err);
                return; // si falla, no continúes a abrir el diálogo sin material
            }
            
            var oModelScrap = new JSONModel({
                Orden: sOrden,
                Operacion: sOperacion,
                Material: sMaterialScrap,
                TotalScrap: 0,
                TotalScrapNotificado: 0,
                ITEMS: aItemsScrap
            });

            if (!this._oDialogScrap) {
                this._oDialogScrap = await Fragment.load({
                    id: oView.getId(),
                    name: "serviacero.custom.plugins.zpluginHabilitadosV2.zpluginHabilitadosV2.fragments.scrap",
                    controller: this
                });
                oView.addDependent(this._oDialogScrap);
            }

            this._oDialogScrap.setModel(oModelScrap, "scrap");
            this._oDialogScrap.open();
            this.onConsultaScrapTotal(sOrden, sMaterialScrap, planta);
        },

        _prorratearScrap: function (aItems) {
            var oGrupos = {};

            aItems.forEach(function (item) {
                var sKey = item.NoPlano + "|" + item.Figura;

                if (!oGrupos[sKey]) {
                    oGrupos[sKey] = {
                        cantidadTotal: 0,
                        scrapTotal: 0
                    };
                }

                oGrupos[sKey].cantidadTotal += Number(item.CantidadPlan) || 0;
                oGrupos[sKey].scrapTotal += Number(item.cantidadScrap) || 0;
            });
            return aItems.map(function (item) {
                var sKey = item.NoPlano + "|" + item.Figura;
                var oGrupo = oGrupos[sKey];

                var nFactor = oGrupo.cantidadTotal > 0
                    ? oGrupo.scrapTotal / oGrupo.cantidadTotal
                    : 0;

                var nBase = (Number(item.CantidadBuena) > 0)
                    ? Number(item.CantidadBuena)
                    : Number(item.CantidadPlan) || 0;

                var nScrapProrrateado = nFactor * nBase;

                return Object.assign({}, item, {
                    cantidadScrap: Math.round(nScrapProrrateado * 100) / 100 
                });
            });
        },

        onSeleccionScrap: function () {
            this._recalcularTotalScrap();
        },
        

        onConsultaScrapTotal: async function (sOrden, sMaterialScrap, planta) {
            var oThis = this;
            var oModelScrap = this._oDialogScrap.getModel("scrap");

            if (!sMaterialScrap) {
                oModelScrap.setProperty("/TotalScrapNotificado", 0);
                return;
            }

            var publicApiUri = this.getPublicApiRestDataSourceUri();

            try {
                let requestJSON = {
                    plant: planta,
                    order: sOrden
                };
                let url = publicApiUri + "order/v1/orders?async=false";

                let oOrderData = await new Promise(function (resolve, reject) {
                    oThis.ajaxGetRequest(url, requestJSON, resolve, reject);
                });

                let sfc = oOrderData.sfcs?.[0] || "";

                let requestJSON2 = {
                    plant: planta,
                    order: sOrden,
                    sfc: sfc
                };
                let url2 = publicApiUri + "inventory/v1/inventory/goodsReceipts/summarize?async=false";

                let oGoodsIssueData = await new Promise(function (resolve, reject) {
                    oThis.ajaxGetRequest(url2, requestJSON2, resolve, reject);
                });

                var aConsumosScrap = (oGoodsIssueData.sfcs[0].items || []).filter(function (oCon) {
                    return (
                        oCon.material === sMaterialScrap
                    );
                });

                var fTotalNotificado = aConsumosScrap.reduce(function (sum, oCon) {
                    return sum + Math.abs(Number(oCon.quantityInBaseUnit?.value || 0));
                }, 0);

                oModelScrap.setProperty("/TotalScrapNotificado", fTotalNotificado);

            } catch (oError) {
                var err = oError?.message || oError;
                MessageToast.show(err);
                oModelScrap.setProperty("/TotalScrapNotificado", 0);
            }
        },

        onCambioCantidadScrap: function (oEvent) {
            var oInput = oEvent.getSource();
            var oContext = oInput.getBindingContext("scrap");
            var sNuevoValor = oEvent.getParameter("value");

            oContext.getModel().setProperty(
                oContext.getPath() + "/cantidadScrap",
                Number(sNuevoValor) || 0
            );

            this.onRecalcularTotalScrap(oEvent);
        },

        onRecalcularTotalScrap: function (oEvent) {
            var oTable = this.byId("HABILITADOS_SCRAP");
            var oListItem = oEvent.getParameter("listItem");
            var bSelected = oEvent.getParameter("selected");
            if (oListItem) {
                var oContext = oListItem.getBindingContext("scrap");
                var oData = oContext.getObject();

                if (bSelected && !oData.Enabled) {
                    oTable.setSelectedItem(oListItem, false);
                    MessageToast.show("Ya se envió el scrap para esta fila, seleccione una diferente");
                    return;
                }
            } else {
                oTable.getItems().forEach(function (oItem) {
                    var oCtx = oItem.getBindingContext("scrap");
                    if (oCtx && !oCtx.getObject().Enabled && oItem.getSelected()) {
                        oTable.setSelectedItem(oItem, false);
                    }
                });
            }
            var oTableScrap = this.byId("HABILITADOS_SCRAP");
            var oModelScrap = this._oDialogScrap.getModel("scrap");
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

        onGuardarScrap: function () {
            var oModelScrap = this._oDialogScrap.getModel("scrap");
            var materialScrap = this.byId("MaterialScrap").getText();
            var tipo = "SCRAP";
            var total = this.byId("TotalScrap").getText();

            var oTable = this.byId("HABILITADOS_SCRAP");
            var aSelectedItems = oTable.getSelectedItems();

            var aItems = aSelectedItems
                .map(function (oItem) {
                    return oItem.getBindingContext("scrap").getObject();
                })
                .filter(function (oItem) {
                    return oItem.status === "C";
                });

            this.sendByProduct(tipo, materialScrap, total, aItems,"","");
            this._oDialogScrap.close();
        },

        formatearTextoStatus: function (estado) {
            if (estado !== null) {
                return this.obtenerDatosStatus(estado).texto;
            }
        },

        formatearColorStatus: function (estado) {
            if (estado !== null) {
                return this.obtenerDatosStatus(estado).color;
            }
        },
        obtenerDatosStatus: function (estado) {
            switch (estado) {
                case "": //Nada
                    return {
                        "texto": "Sin iniciar",
                        "color": "Indication12",
                        "icono": "sap-icon://pending",
                        "estadoBotonIniciar": true,
                        "estadoInputCtdBuena": false,
                        "estadoBotonCompletar": false
                    };
                case "S": //Iniciado
                    return {
                        "texto": "iniciado",
                        "color": "Indication15",
                        "icono": "sap-icon://wrench",
                        "estadoBotonIniciar": false,
                        "estadoInputCtdBuena": true,
                        "estadoBotonCompletar": true
                    };
                case "C": //Completado
                    return {
                        "texto": "Completado sin Scrap",
                        "color": "Indication14",
                        "icono": "sap-icon://status-positive",
                        "estadoBotonIniciar": false,
                        "estadoInputCtdBuena": false,
                        "estadoBotonCompletar": false
                    };
                case "P": //Pausa
                    return {
                        "texto": "Pausa",
                        "color": "Indication13",
                        "icono": "sap-icon://pause",
                        "estadoBotonIniciar": true,
                        "estadoInputCtdBuena": false,
                        "estadoBotonCompletar": false
                    };
                case "E": //Entregdo
                    return {
                        "texto": "Entrega de Scrap",
                        "color": "Indication15",
                        "icono": "sap-icon://status-positive",
                        "estadoBotonIniciar": false,
                        "estadoInputCtdBuena": false,
                        "estadoBotonCompletar": false
                    };
                default:
                    break;
            }
        },

        // Logica Fragment Largo Diverso

        GetLargoDiverso: async function () {
            var oView = this.getView();
            var oThis = this;
            var oTableHabilitados = this.byId("HABILITADOS_TABLE");
            var oModelHabilitados = oTableHabilitados.getModel();
            var aItemsHabilitados = (oModelHabilitados && oModelHabilitados.getProperty("/ITEMS")) || [];

            if (aItemsHabilitados.length === 0) {
                MessageToast.show("Debe escanear primero para poder abrir el Largo Diverso");
                return;
            }

            var aPlanosVistos = [];
            var aItemsLargo = aItemsHabilitados.reduce(function (aAcc, item) {
                if (aPlanosVistos.indexOf(item.NoPlano) === -1) {
                    aPlanosVistos.push(item.NoPlano);
                    aAcc.push({
                        NoPlano: item.NoPlano,
                        Figura: item.Figura,
                        Zmatprim1: item.Zmatprim1,
                        cantidadNotificar: 0,
                        Labels: 0
                    });
                }
                return aAcc;
            }, []);

            var sOrden = this.byId("ordenPadre").getText();
            var sOperacion = this.byId("operacion").getText();
            let planta = this.getPodController().getUserPlant();
            var publicApiUri = this.getPublicApiRestDataSourceUri();
            var sMaterial = "";

            try {
                let requestJSON = {
                    plant: planta,
                    order: sOrden
                };
                let url = publicApiUri + "order/v1/orders?async=false";

                let oOrderData = await new Promise(function (resolve, reject) {
                    oThis.ajaxGetRequest(url, requestJSON, resolve, reject);
                });

                let bom = oOrderData.bom?.bom || "";
                let requestJSON2 = {
                    plant: planta,
                    bom: bom,
                    type: "SHOP_ORDER"
                };
                let url2 = publicApiUri + "bom/v1/boms?async=false";

                let oBomData = await new Promise(function (resolve, reject) {
                    oThis.ajaxGetRequest(url2, requestJSON2, resolve, reject);
                });

                let oBom = oBomData?.[0] || {};
                let aComponents = oBom.components || [];
                let operationSuffix = sOperacion;
                let oOperacion = aComponents.find(function (oComp) {
                    let sOperation =
                        oComp.assemblyOperationActivity?.operationActivity || "";

                    return sOperation.endsWith(operationSuffix);
                });
                let operationActivity =
                    oOperacion?.assemblyOperationActivity?.operationActivity || "";

                let oComponenteScrap = aComponents.find(function (oComp) {
                    var sOperation =
                        oComp.assemblyOperationActivity?.operationActivity || "";

                    return (
                        oComp.componentType === "BY_PRODUCT" &&
                        oComp.unitOfMeasure === "M2" &&
                        sOperation === operationActivity
                    );
                });

                sMaterial = oComponenteScrap?.material?.material || "";
                console.log(sMaterial);

            } catch (oError) {
                var err = oError?.message || oError;
                MessageToast.show(err);
                return; // si falla, no continúes a abrir el diálogo sin material
            }

            var oModelLargo = new JSONModel({
                Orden: sOrden,
                Operacion: sOperacion,
                Material: sMaterial,
                TotalNotificar: 0,
                ITEMS: aItemsLargo
            });

            if (!this._oDialogLargoDiverso) {
                this._oDialogLargoDiverso = await Fragment.load({
                    id: oView.getId(),
                    name: "serviacero.custom.plugins.zpluginHabilitadosV2.zpluginHabilitadosV2.fragments.largo",
                    controller: this
                });
                oView.addDependent(this._oDialogLargoDiverso);
            }

            this._oDialogLargoDiverso.setModel(oModelLargo, "largo");
            this._oDialogLargoDiverso.open();
        },

        onCambioCantidadLargo: function (oEvent) {
            var oInput = oEvent.getSource();
            var oContext = oInput.getBindingContext("largo");
            var sNuevoValor = oEvent.getParameter("value");

            oContext.getModel().setProperty(
                oContext.getPath() + "/cantidadNotificar",
                Number(sNuevoValor) || 0
            );

            this.onRecalcularTotalLargo();
        },

        onRecalcularTotalLargo: function () {
            var oTableLargo = this.byId("HABILITADOS_LARGO");
            var oModelLargo = this._oDialogLargoDiverso.getModel("largo");
            var aContextosSeleccionados = oTableLargo.getSelectedContexts();

            var iTotal = aContextosSeleccionados.reduce(function (iSuma, oContext) {
                var item = oContext.getObject();
                return iSuma + (Number(item.cantidadNotificar) || 0);
            }, 0);

            oModelLargo.setProperty("/TotalNotificar", iTotal);
        },

        onCerrarLargoDiverso: function () {
            this._oDialogLargoDiverso.close();
        },

        onGuardarLargoDiverso: function () {
            var tipo = "LARGO";
            var total = this.byId("TotalNotificarLargo").getText();
            var materialLargo = this.byId("MaterialLargo").getText();
            var oTableLargo = this.byId("HABILITADOS_LARGO");

            var aSelectedItems = oTableLargo.getSelectedItems();
            var aItems = aSelectedItems.map(function (oItem) {
                return oItem.getBindingContext("largo").getObject();
            });

            var labels = aItems.reduce(function (nSum, oItem) {
                return nSum + (Number(oItem.Labels) || 0);
            }, 0);

            var materialConsumo = aItems.length > 0 ? aItems[0].Zmatprim1 : "";

            var planos = aItems.map(function (oItem) {
                return oItem.NoPlano;
            }).join(",");

            this.sendByProduct(tipo, materialLargo, total, [], labels, materialConsumo,planos);
            this._oDialogLargoDiverso.close();
        },
        
        // Logica envio de sub productos

        sendByProduct: function (tipo,material,total,itemsScrap,labels,materialConsumo,planos) {
            var oThis = this;
            var user = this.getPodController().getUserId();
            var plant = this.getPodController().getUserPlant();
            var oView = this.getView();
            var materialFormateado = material.padStart(18, "0");
            var materialConsumoFormateado = materialConsumo.padStart(18, "0");
            var requestJSON = {
                "inMaterial": materialFormateado,
                "inMaterialConsumo": materialConsumoFormateado,
                "inOrder": this.byId("ordenPadre").getText(),
                "inPlant": plant,
                "inQuantity": total,
                "inUser": user,
                "inType": tipo,
                "inItemsScrap": JSON.stringify(itemsScrap),
                "inLabels": labels || 1,
                "inWorkCenter": "CC02",
                "inPlanos" : planos
            };
            var oTable = this.byId("HABILITADOS_TABLE");

            var url = this.getPublicApiRestDataSourceUri() +
                "/pe/api/v1/process/processDefinitions/start?key=REG_870dc0c7-009d-48d7-98f2-594f0efd5376&async=false";
            try {
                this.ajaxPostRequest(url, requestJSON,
                    function (oResponseData) {
                        MessageBox.success(oResponseData.outMessage);
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
                                            proyecto: oThis._ultimoScan.proyecto,
                                            entrega: oThis._ultimoScan.entrega,
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
                    },
                    function (oError, sHttpErrorMessage) {
                        var err = oError || sHttpErrorMessage;
                        MessageToast.show(err);
                        //fnCallback && fnCallback();
                    })
            } catch (error) {
                MessageBox.error(oThis.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico"));
                fnCallback && fnCallback();
            }
        },
    });
});