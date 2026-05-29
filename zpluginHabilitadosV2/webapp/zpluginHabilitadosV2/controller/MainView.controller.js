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
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/ui/model/FilterOperator",
    'sap/ui/core/BusyIndicator',
    "sap/ui/model/Sorter",
    "sap/ui/core/Fragment",
], function (jQuery, PluginViewController, JSONModel, IconPool, Dialog, Button, mobileLibrary, List, StandardListItem, Text, MessageToast, Filter, MessageBox, FilterOperator, BusyIndicator, Sorter, Fragment) {
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

        cargarTabla: function (data) {
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
                        var oModel = new sap.ui.model.json.JSONModel();
                        if (oResponseData.outData.value !== undefined) {
                            oItems.ITEMS = oResponseData.outData.value.map(function (item) {

                                var plan = Number(item.CantidadPlan) || 0;
                                var buena = Number(item.CantidadBuena) || 0;

                                return Object.assign({}, item, {
                                    cantidadPendiente: plan - buena
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
                                    cantidadPendiente: plan - buena
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
                    oThis.byId("sfc").setText(oResponseData.sfcs[0])
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
            let value = oContext.getProperty("cantidadPendiente") || 0;
            let cantNoti = oContext.getProperty("cantidadNotificada") || 0;
            let cantTotal = oContext.getProperty("cantidadTotal") || 0;
            oContext.getModel().setProperty(oContext.getPath() + "/cantidadPendiente", value + 1);
        },

        onRestar: function (oEvent) {

            const oContext = oEvent.getSource().getBindingContext();
            const oModel = oContext.getModel();
            const sPath = oContext.getPath();

            let pendiente = oModel.getProperty(sPath + "/cantidadPendiente");

            if (pendiente > 0) {
                oModel.setProperty(sPath + "/cantidadPendiente", pendiente - 1);
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
                    Number(item.cantidadPendiente || 0);
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
                "inOrden": orden,
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
                    var cantidadPendiente = +item.cantidadPendiente || 0;
                    var cantidadPlan = +item.CantidadPlan || 0;
                    var cantidadBuena = +item.CantidadBuena || 0;
                    return {
                        ...item,

                        AgregarPosicion:
                            cantidadPendiente < (cantidadPlan - cantidadBuena)
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
                                oThis.cargarTabla(oThis._ultimoScan);
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
            var order = this.byId("orden").getText();
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
            var orden = this.byId("orden").getText() || "1000884";
            var operacion = this.byId("operacion").getText() || "1000884";
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
                                        let oConsumo =
                                            oGoodsIssueData.lineItems.find(function (oCon) {
                                                return (
                                                    oCon.materialId?.material ===
                                                    oItem.material
                                                );
                                            });
                                        let fConsumida =
                                            Number(
                                                oConsumo?.consumedQuantity?.value || 0
                                            );

                                        oItem.cantidadConsumida =
                                            fConsumida;

                                        oItem.cantidadPendiente =
                                            oItem.cantidadNecesaria -
                                            fConsumida;

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
            var order = this.byId("orden").getText() || "1000884";
            var operacion = this.byId("operacionActividad").getText() || "1000884";
            var bom = this.byId("bom").getText() || "1000884";
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
        }
    });
});