Ext.define('CalendarMatrix.view.PickerOverride', {
    override: 'Ext.form.field.Picker',
	
    onTriggerClick: function(e) {
        var me = this;
		
		if (me.useCalendarMatrix){
            me.fireEvent('trigcalmatrix', me);
		}
		else {
			if (!me.readOnly && !me.disabled) {
				if (me.isExpanded) {
					me.collapse();
				} else {
					me.expand();
				}
			}
		}
    },	
});	