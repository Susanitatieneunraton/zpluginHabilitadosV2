sap.ui.define([
    "sap/ui/model/resource/ResourceModel",
    "sap/dm/dme/podfoundation/control/PropertyEditor"
], function (ResourceModel, PropertyEditor) {
    "use strict";
    
    var oFormContainer;

    return PropertyEditor.extend( "serviacero.custom.plugins.zpluginHabilitadosV2.zpluginHabilitadosV2.builder.PropertyEditor" ,{

		constructor: function(sId, mSettings){
			PropertyEditor.apply(this, arguments);
			
			this.setI18nKeyPrefix("customComponentListConfig.");
			this.setResourceBundleName("serviacero.custom.plugins.zpluginHabilitadosV2.zpluginHabilitadosV2.i18n.builder");
			this.setPluginResourceBundleName("serviacero.custom.plugins.zpluginHabilitadosV2.zpluginHabilitadosV2.i18n.i18n");
		},
		
		addPropertyEditorContent: function(oPropertyFormContainer){
			var oData = this.getPropertyData();
			
			this.addSwitch(oPropertyFormContainer, "backButtonVisible", oData);
			this.addSwitch(oPropertyFormContainer, "closeButtonVisible", oData);
						
			this.addInputField(oPropertyFormContainer, "title", oData);
			this.addInputField(oPropertyFormContainer, "text", oData);

            oFormContainer = oPropertyFormContainer;
		},
		
		getDefaultPropertyData: function(){
			return {
				
				"backButtonVisible": true,
				"closeButtonVisible": true,
                "title": "zpluginHabilitadosV2",
				"text": "zpluginHabilitadosV2"
                
			};
		}

	});
});