Ext.define('Ext.calendar.view.Year', {
    extend: 'Ext.container.Container',
    alias: 'widget.yearview',

    itemId: 'yearview',
    minHeight: 700,
    style: 'background-color: white;',
    layout: {
        type: 'hbox',
        align: 'stretch',
        pack: 'center'
    },

    initComponent: function() {
        var me = this;

        me.callParent(arguments);

        var cal = Ext.create('Ext.ux.CalendarMatrix.CalendarMatrix', {
            startMonthIdx: 0,
            numRows: 3,
            numCols: 4,
            matrixDisabled: false,
            matrixMode: 'SINGLE',			
            cls: 'matrix-cal-year',
            itemId: 'yearCal'
        });
		
		cal.mon(cal, 'calendarselect', me.handleSelect, me);
		cal.mon(cal, 'monthselect', me.handleMonthSelect, me);

        // Proceed to remove default month navigation toolbar and add custom arrows
        var toolbar = cal.down('#calGridToolBar');
        cal.remove(toolbar, true);

        me.add(cal);
    },
	
    moveNext: function(calendarPanel) {
		this.down('#yearCal').onNextCalGridMatrixClick();
        return calendarPanel.startDate;
    },

    // inherited docs
    movePrev: function(calendarPanel) {
		this.down('#yearCal').onPriorCalGridMatrixClick();
        return calendarPanel.startDate;
    },	
	
    setStartDate: function(start, refresh) {
		var me = this;
		if (refresh){
			var calendarMatrix = me.down('#yearCal');
			calendarMatrix.setStartMonthIdx(Ext.Date.diff(Ext.Date.clearTime(Ext.Date.getFirstDateOfMonth(calendarMatrix.today), true),
														  Ext.Date.clearTime(Ext.Date.getFirstDateOfMonth(start), true),
														  Ext.Date.MONTH));
			calendarMatrix.dispCalGrid();	
		}		
		this.startDate = start;		
	},
	
    getStartDate: function(start, refresh) {
	   return this.startDate;
	},	
	
	handleSelect: function(calendarMatrix, selDt, selDate, selVal) {
		var calendarPanel = Ext.getCmp('app-calendar');
		calendarPanel.startDate = selDate;
		calendarPanel.onDayClick();
	},
	
	handleMonthSelect: function(calendar, minDate, maxDate) {
		var calendarPanel = Ext.getCmp('app-calendar');
		calendarPanel.startDate = minDate;
		calendarPanel.onMonthClick();
	},	
	
	getViewBounds: function() {
		var me = this;
		var calendarMatrix = me.down('#yearCal');
		var firstMatrixItem = calendarMatrix.down('#'+calendarMatrix.matrix[0].itemId+'_mc');
		var lastMatrixItem = calendarMatrix.down('#'+calendarMatrix.matrix[calendarMatrix.matrix.length-1].itemId+'_mc');

        return {
            start: firstMatrixItem.minDate,
            end: lastMatrixItem.maxDate
        };
    },


});