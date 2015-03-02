Ext.define('Ext.ux.CalendarMatrix.CalendarMatrix', {
    extend: 'Ext.container.Container',
    alias: 'widget.calendarMatrix',

    requires: [
        'Ext.container.Container',
        'Ext.button.Button',
        'Ext.ux.CalendarMatrix.DateMatrixPickerExtension'
    ],

    config: {
        startMonthIdx: 0,  // 0 for calendar to start at current month ... -6 to start 6 months back ... +6 to start 6 months forward
        numRows: 4,
        numCols: 3,
        
        matrixDisabled: true,  // TRUE to set entire date picker component as disabled (i.e. no user interactions)
        matrixMode: 'NONE',  // Selection mode types RANGE, MULTI, SINGLE, NONE (set MatrixDisabled=true for NONE)
        
        initRangeDts: [],  // Pass 2-element array defining start and end dates of pre-determined range in 'yyyy-mm-dd' format.  Example: ['2015-02-02', '2015-02-05'] 
        rangeSelectMode: 'default', // When matrixMode='RANGE', 'startdate' indicates we are selecting start date and 'enddate' for end date
                                      // Use 'default' for smart selection based on user clicks
        rangeStartDateModeCls: 'startdate-mode',  // Class added when in startdate mode selection
        rangeEndDateModeCls: 'enddate-mode',  // Class added when in enddate mode selection
        rangeStartDtCls: 'matrix-cal-startdt',  // Custom class for start date when range selection used
        rangeEndDtCls: 'matrix-cal-enddt',  // Custom class for end date when range selection used
        
        initSelectedDts: [],  // Pass array of pre-selected dates in 'YYYY-MM-DD' format to be styled via 'selectedCls'   
        selectedCls: 'matrix-cal-selected',
        
        priorMatrixDts: [],  // Defines pre-defined custom ranges with Color and/or CLS
        // priorMatrixDts: [
        //     {
        //         priorDt: '2014-01-14',
        //         cls: '',
        //         backgroundColor: 'green'
        //     },
        //     {
        //         priorDt: '2014-01-15',
        //         cls: 'unavail-orange',
        //         backgroundColor: ''
        //     }
        // ]        
        disabledMatrixDts: [],  // Defines sets of disabled dates with Color and/or CLS
        // disabledMatrixDts: [
        //     {
        //         disabledDt: '2014-02-18',
        //         cls: '',
        //         backgroundColor: 'purple'
        //     },
        //     {
        //         disabledDt: '2014-02-19',
        //         cls: 'unavail-orange',
        //         backgroundColor: ''
        //     }
        // ]        
        disableFn: null, // Custom function which returns true to disable passed date.  Parameters:  (cellDate, matrixCont)
        customClsFn: null, // Custom function which returns additional class to be applied to passed date
        monthTextFn: function(myDate){return Ext.Date.format(myDate, 'F Y');},   // Allows customization of Month text
        includeMonthPicker: true,  // false to hide/disable arrow dropdown allowing user to change month/year from monthpicker
        startDay: 0,  // Defines day of week that locale calendar starts on
        renderTplOverride: null,  // If TPL provided, then overrides Ext.Date.picker.renderTpl
        overrideCellHtmlFn: null  // Pass custom function to override cell Html (see customCellHtml() method in Ext.ux.CalendarMatrix.DateMatrixPickerExtension)
    },

    cls: 'matrix-cal',
    itemId: 'matrixCalendar',
    defaultListenerScope: true,

    items: [
        {
            xtype: 'container',
            cls: 'cal-grid-toolbar',
            itemId: 'calGridToolBar',
            reference: 'calGridToolBar',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items: [
                {
                    xtype: 'button',
                    itemId: 'priorCalGridMatrix',
                    reference: 'priorCalGridMatrix',
                    cls: 'cal-grid-prior-btn',
                    iconCls: '',            
                    text: '<<',
                    listeners: {
                        click: 'onPriorCalGridMatrixClick'
                    }
                },
                {
                    xtype: 'container',
                    flex: 1,
                    cls: 'cal-grid-title',
                    itemId: 'calGridTitle',
                    reference: 'calGridTitle'
                },
                {
                    xtype: 'button',
                    itemId: 'nextCalGridMatrix',
                    reference: 'nextCalGridMatrix',
                    cls: 'cal-grid-next-btn',    
                    iconCls: '',            
                    text: '>>',
                    listeners: {
                        click: 'onNextCalGridMatrixClick'
                    }
                }
            ]
        },
        {
            xtype: 'container',
            cls: 'cal-grid-card',
            itemId: 'calGridCard',
            reference: 'calGridCard',
            layout: 'fit'
        }
    ],
    listeners: {
        afterrender: 'onCalGridAfterRender'
    },

    onPriorCalGridMatrixClick: function(button, e, eOpts) {
        var me = this;
        me.setStartMonthIdx(me.getStartMonthIdx() - me.numMonths);
        me.dispCalGrid();
    },
        
    onNextCalGridMatrixClick: function(button, e, eOpts) {
      var me = this;
    me.setStartMonthIdx(me.getStartMonthIdx() + me.numMonths);
        me.dispCalGrid();
    },

    onTodayButtonClick: function(button, e, eOpts) {
        var me = this;
        // Go to starting matrix unless we started outside current date
        me.setStartMonthIdx(0);
        me.dispCalGrid();
    me.fireEvent('monthnav', me); // Can be used by external processes to conditionally hide month navigation arrows
    },
    
    onTodayArrowClick: function(button, e, eOpts) {
        var me = this, matrixItem, monthPicker, el, x, y;
        matrixItem = me.down('#'+me.matrix[0].itemId+'_mc'); // Initialize from 1st displayed calendar
        
        el = button.getEl();
        x = el.getX();
        y = el.getY()+el.getHeight()+10;

        monthPicker = me.monthPicker;
        if (!monthPicker) {  
            monthPicker = Ext.create('Ext.window.Window', {
                          width: 230,
                          height: 260,
                          cls: me.cls,
                          header: false,
                          modal: true,
                          items: 
                             {xtype: 'monthpicker',
                              height: '100%',
                              width: '100%',
                              value: matrixItem.minDate, // Default to first month in matrix
                              listeners: {
                                 scope: me,
                                 cancelclick: me.onMonthPickerCancelClick,
                                 okclick: me.onMonthPickerOkClick,
                                 yeardblclick: me.onMonthPickerOkClick,
                                 monthdblclick: me.onMonthPickerOkClick
                              }
                             }
            });
            me.monthPicker = monthPicker;
        }
        else {
          monthPicker.down('monthpicker').setValue(matrixItem.minDate);
        }
        monthPicker.showAt(x,y,true);

    },

    onMonthPickerCancelClick: function() {
        this.monthPicker.setVisible(false);     
    },
    onMonthPickerOkClick: function(picker, value) {
        var me = this,
            month = value[0],
            year = value[1],
            date = new Date(year, month, 1);

        if (date.getMonth() !== month) {
            // 'fix' the JS rolling date conversion if needed
            date = Ext.Date.getLastDateOfMonth(new Date(year, month, 1));
        }
        me.monthPicker.setVisible(false);     
        me.setStartMonthIdx(Ext.Date.diff(Ext.Date.clearTime(Ext.Date.getFirstDateOfMonth(me.today), true), date, Ext.Date.MONTH));

        me.dispCalGrid();      
    me.fireEvent('monthnav', me); // Can be used by external processes to conditionally hide month navigation arrows
    },

    onCalGridAfterRender: function(component, eOpts) {
        var me = this;
        me.mon(me, 'select', me.onDateSelected, me);
    },

    dispCalGrid: function(firstTime) {
        var me = this;

        var startMonthIdx = me.getStartMonthIdx(),
            numRows  = me.getNumRows(),
            numCols  = me.getNumCols(),
            today    = me.today,
            firstdt  = Ext.Date.clearTime(Ext.Date.getFirstDateOfMonth(today), true);

        var i,j, k, thisItemId, startdt, lastdt, calItem, monthYr, calGridTitle, contItems = [];

        Ext.destroy(me.matrix);
        me.matrix = [];  // reset

        k = startMonthIdx;
        for (i=0; i< me.getNumRows(); i++){
            rowItems=[];

            for (j=0; j< me.getNumCols(); j++){

                startdt = Ext.Date.add(firstdt, Ext.Date.MONTH, k);
                lastdt = Ext.Date.clearTime(Ext.Date.getLastDateOfMonth(startdt), true);
                monthYr = Ext.Date.format(startdt, 'F')+  ' ' + Ext.Date.format(startdt, 'Y');
                k++;

                thisItemId = 'calGridR'+i.toString()+'C'+j.toString();

                calItem = {xtype: 'dateMatrixPickerExtension',
                           cls: 'cal-grid',
                           nextText: '',
                           prevText: '',
                           matrixCont: me,
                           parentId: thisItemId,
                           itemId: thisItemId+'_mc',
                           monthYearText: '',
                           showToday: false,
                           minDate: startdt,
                           maxDate: lastdt,
                           minText: '',
                           maxText: '',
                           disabled: me.getMatrixDisabled(),  
                           startDay: me.getStartDay(),  
                           renderTpl: me.getRenderTplOverride() ? me.getRenderTplOverride() : Ext.picker.Date.prototype.renderTpl
                };

                me.matrix.push({itemId: thisItemId, monthYr: monthYr});
                rowItems.push({
                    xtype: 'container',
                    itemId: thisItemId,
                    items: [calItem]
                });
            }

            contItems.push({xtype: 'container',
                            layout: {
                                type: 'hbox',
                                align: 'stretch'
                            },
                            items: rowItems
                           });
        }

        var card = me.down('#calGridCard');
        var nextItem = {
            xtype: 'container',
            items: contItems
    
        };
        card.removeAll(true);
        card.add(nextItem);
    },

    onDateSelected: function(thisCal) {
        var me = this;

        var i, selDate, selDt, selVal, matrixItem, multiIdx,
         rangeSelectMode = me.getRangeSelectMode(),
         disableFn =  me.getDisableFn();
         selDate = thisCal.value;
         selDt = Ext.Date.format(selDate, 'Y-m-d');
         selVal = +Ext.Date.clearTime(selDate, true);

        if (me.matrixMode === 'NONE'){
            // Do nothing
        }

        else if (me.disabledValues.indexOf(selVal) !== -1) {
            // Don't allow selection of disabledValues
            return;
        }
    
        else if (disableFn && disableFn(selDate, me)){
            // Don't allow selection of disabledValues
            return;
        }

        else if (me.matrixMode === 'SINGLE'){  // only select, not de-select same selection implemented
            me.selectedDts = [];  // Reset any prior selections
            if (me.selectedValues.indexOf(selVal) === -1){
                me.selectedDts.push({
                    selectedDt: selDt,
                    selectedDate: selDate,
                    selectedVal: selVal
                });
            }
            me.selectedValues = Ext.Array.pluck(me.selectedDts, 'selectedVal');
            
            // refresh all matrix calendars based on selected date
            for (i=0; i<me.matrix.length; i++){
                matrixItem = me.down('#'+me.matrix[i].itemId+'_mc');
                matrixItem.fullUpdate(selDate);
            }
        }

        else if (me.matrixMode === 'RANGE'){
            // Store endpoints to rangeDt1 and rangeDt2 and handle select prior to as well as after scenarios
            if (rangeSelectMode === 'startdate'){
                me.rangeDt1 = selDt;
                me.rangeDate1 = selDate;
                if (!Ext.isEmpty(me.rangeDt2) && me.rangeDt1 > me.rangeDt2){ // Adjust rangeDt2 if prior to rangeDt1
                    me.rangeDt2 = null;
                    me.rangeDate2 = null;                 
                }
            }
            else if (rangeSelectMode === 'enddate'){
                me.rangeDt2 = selDt;
                me.rangeDate2 = selDate;
                if (!Ext.isEmpty(me.rangeDt1) && me.rangeDt1 > me.rangeDt2){ // Adjust rangeDt1 if prior to rangeDt1
                    me.rangeDt1 = null;
                    me.rangeDate1 = null;                 
                }
            }
            else if (Ext.isEmpty(me.rangeDt1) || Ext.isEmpty(me.rangeDt2)){
                me.rangeDt1 = selDt;
                me.rangeDate1 = selDate;
                me.rangeDt2 = selDt;
                me.rangeDate2 = selDate;
            }
            else if (me.rangeDt1 < selDt){
                me.rangeDt2 = selDt;
                me.rangeDate2 = selDate;
            }
            else if ((me.rangeDt1 >= selDt)){
                me.rangeDt2 = me.rangeDt1;
                me.rangeDt1 = selDt;
                me.rangeDate2 = me.rangeDate1;
                me.rangeDate1 = selDate;
            }

            // refresh all matrix calendars based on selected range
            for (i=0; i<me.matrix.length; i++){
                matrixItem = me.down('#'+me.matrix[i].itemId+'_mc');
                matrixItem.fullUpdate(selDate);
            }
        }
        else if (me.matrixMode === 'MULTI'){
            if (!me.selectedDts){
                me.selectedDts = [];
            }
            multiIdx = me.selectedValues.indexOf(selVal);

            if (multiIdx !== -1){
                // remove application of current class to this date (possibly restoring prior assigned class)
                Ext.Array.splice(me.selectedDts, multiIdx, 1);
            }
            else {
                me.selectedDts.push({
                    selectedDt: selDt,
                    selectedDate: selDate,
                    selectedVal: selVal
                });
            }
            me.selectedValues = Ext.Array.pluck(me.selectedDts, 'selectedVal');

            thisCal.fullUpdate(selDate);
        }
        me.fireEvent('calendarselect', me, selDt, selDate, selVal);
    },

    resetMatrix: function() {
        var me = this;
        var i, matrixItem;

        me.rangeDt1 = '';
        me.rangeDate1 = null;
        me.rangeDt2 = '';
        me.rangeDate2 = null;

        me.selectedValues = [];
        me.selectedDts = [];

        for (i=0; i<me.matrix.length; i++){
            matrixItem = me.down('#'+me.matrix[i].itemId+'_mc');
            matrixItem.setDisabled(me.getMatrixDisabled());   // SWL UPDATED 2/21/15
            if (matrixItem.rendered){
               matrixItem.fullUpdate();
            }
        }
    },

    processDates: function() {
        var me = this, disabledMatrixDts, priorMatrixDts, initSelectedDts, i, initRangeDts;

        disabledMatrixDts = me.getDisabledMatrixDts();
        priorMatrixDts = me.getPriorMatrixDts();

        for (i=0; i< disabledMatrixDts.length; i++){
            tempDt = disabledMatrixDts[i].disabledDt;
            tempDate = Ext.Date.parse(tempDt, 'Y-m-d');
            tempVal = +Ext.Date.clearTime(tempDate, true);
            disabledMatrixDts[i].disabledDate = tempDate;
            disabledMatrixDts[i].disabledValue = tempVal;
        }
        me.disabledValues = Ext.Array.pluck(disabledMatrixDts, 'disabledValue');
        me.setDisabledMatrixDts(disabledMatrixDts);

        for (i=0; i< priorMatrixDts.length; i++){
            tempDt = priorMatrixDts[i].priorDt;
            tempDate = Ext.Date.parse(tempDt, 'Y-m-d');
            tempVal = +Ext.Date.clearTime(tempDate, true);
            priorMatrixDts[i].priorDate = tempDate;
            priorMatrixDts[i].priorValue = tempVal;
        }
        me.priorValues = Ext.Array.pluck(priorMatrixDts, 'priorValue');
        me.setPriorMatrixDts(priorMatrixDts);

        
        me.selectedValues = [];
        me.selectedDts = [];
        initSelectedDts = me.getInitSelectedDts();
        if (!Ext.isEmpty(initSelectedDts)){
            for (i=0; i< initSelectedDts.length; i++){
                tempDt = initSelectedDts[i];
                tempDate = Ext.Date.parse(tempDt, 'Y-m-d');
                tempVal = +Ext.Date.clearTime(tempDate, true);
                
                me.selectedDts.push({
                    selectedDt: tempDt,
                    selectedDate: tempDate,
                    selectedVal: tempVal
                });
            }
            me.selectedValues = Ext.Array.pluck(me.selectedDts, 'selectedVal');
        }
        
    me.rangeDt1 = '';
        me.rangeDate1 = null;
        me.rangeDt2 = '';
        me.rangeDate2 = null;   
    initRangeDts = me.getInitRangeDts();
    if (!Ext.isEmpty(initRangeDts)){
        me.rangeDt1 = initRangeDts[0];
        me.rangeDt2 = initRangeDts[1];
      me.rangeDate1 = Ext.Date.parse(me.rangeDt1, 'Y-m-d');
      me.rangeDate2 = Ext.Date.parse(me.rangeDt2, 'Y-m-d');     
    }
    },

    initComponent: function(config) {
        var me = this,
            calGridTitle, includeMonthPicker, calGridTodayBtn;
        me.callParent(arguments);
        
        calGridTitle = me.down('#calGridTitle');
        includeMonthPicker = me.getIncludeMonthPicker();
        calGridTitle.add({
                          xtype: includeMonthPicker ? 'splitbutton' : 'button',
                          itemId: 'calGridTodayBtn',
                          reference: 'calGridTodayBtn',
                          cls: 'cal-grid-today-btn',
                          text: 'Today'
                         });
   
        calGridTodayBtn = me.down('#calGridTodayBtn');
        calGridTodayBtn.setHandler(me.onTodayButtonClick, me);
        if (includeMonthPicker) {
            calGridTodayBtn.setArrowHandler(me.onTodayArrowClick, me);
        }
        
        me.processDates();

        me.origStartMonthIdx = me.getStartMonthIdx();
        me.numMonths = me.getNumCols() * me.getNumRows();
        me.today= Ext.Date.clearTime(new Date(), true);

        me.dispCalGrid(true);
    }

});