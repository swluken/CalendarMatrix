Ext.define('Ext.ux.CalendarMatrix.DateFieldMixin', {
  /* NOTES:
  
    DateFieldExample is a Combination example of Single Date selection and Range selection within Forms, Grids (row editing and cell editing).
    It demonstrates custom implementation of CalendarMatrix utilizing Ext.form.field.Date which allows manual date input with
    validation, but where CalendarMatrix replaces the standard datepicker. DateFieldMixin.js is provided which demonstrates how
    a Mixin class can be used to simplify repetitive implementations of common functionality.
    
    - If both dates empty and user clicks on ToDate, then implement SINGLE selection mode
    - If both dates empty and user clicks on FromDate (anchored), then implement RANGE selection mode and after ToDate click,
      continue to select FromDate
    - If both dates populated then accept either ToDate or FromDate based on selection
    
    ***Refer to following 'datefield' configs utilized by DateFieldMixin:
       - useCalendarMatrix: true
       - listeners: {
         trigcalmatrix: 'onFromDtMixin',  [For fromDate field or 'onFromDtMixin' for toDate field]
         focus: 'onDatefieldFocusMixin', [Needed if using default validator when datefield updated manually before clicking on datepicker.
                                          Also for single select fields enables config to support reset button]
         handlemonthnav: 'onDisableNavPriorToToday'  [Optional listener which calls custom view controller method to apply custom logic when
                                                      Today button clicked or monthpicker used ... see onDisableNavPriorToToday() for example]
       - validator: [Optional function to override default validator logic to ensure enddate > startdate]
       - reference:  unique identifier for this view for each datefield 
       - dateFieldMixinConfig: {
         [minimum REQUIRED configs]
           fromRef: 'fromDt4',  
           toRef: 'toDt4',  [required for ToDt fields only]
           cellEditMode: true  [required for grid cell editing only ... also see view initComponent() method for additional requirements]
           
         [optional configs (with defaults) ... NOTE:  all configs defined in fromRef will be auto-applied to toRef field so no need to duplicate]
           windowFromTitle: 'Select From Date:',  
           windowToTitle: 'Select To Date:', 
         windowNm : fromRef + 'Window',  // 
         windowCls : 'datefield-mixin-window',
         matrixRef : fromRef + 'CalendarMatrix',
         offset : {x: 15, y: 15},
         width: 688,  // Width, Height based on current theme (Crisp) and number of columns (3) ... which can can be overridden
         height: 300,
          Plus any config supported by CalendarMatrix...
      Plus any custom configs to be utilized by specific implementations
         }
         
    ***Refer to following required Override for this implemenation:
    
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
  
  */
  
    createWindowMixin: function(rangeSelectMode, myViewConfig, title) {
        var me = this, myWindow;

        myWindow = Ext.create('Ext.window.Window', {
            width: myViewConfig.width,  // Width, Height based on current theme and number of columns
            maxWidth: myViewConfig.width,  // myViewConfig.width
            height: myViewConfig.height,  // myViewConfig.height
            cls: myViewConfig.windowCls,
            style: 'padding: 4px;',
            itemId: 'calendarPopupWindow',
            header: true,
            closable: true,
            closeAction: 'hide',
            title: title,
            modal: true,
            myViewConfig: myViewConfig
        });
        myWindow.mon(myWindow, 'close', me.windCloseMixin, me);

        var myView = me.getView();
        var dateFieldMixinWindows = myView.dateFieldMixinWindows;
        if (!dateFieldMixinWindows){ // Create listener to destroy generated windows with view is destroyed. 
           myView.dateFieldMixinWindows = [myWindow];  // Initialize array of windows to be destroyed
           myView.mon(myView, 'destroy', function(view) {
              var dateFieldMixinWindows = view.dateFieldMixinWindows;
              if (dateFieldMixinWindows){
                for (var i=0; i<dateFieldMixinWindows.length; i++){
                  console.log('Destroying window for: '+dateFieldMixinWindows[i].myViewConfig.matrixRef);
                  dateFieldMixinWindows[i].destroy();
                }
              }
           });
        }
        else {  // Else add new window to list of windows to be destroyed.
          myView.dateFieldMixinWindows.push(myWindow);
        }

        me.getView()[myViewConfig.windowNm] = myWindow;

        var today= Ext.Date.clearTime(new Date(Date(Ext.Date.now())), true);

        var calCfg = Ext.applyIf(Ext.clone(myViewConfig), {
            startMonthIdx: -1,
            numRows: 1,
            numCols: 3,
            matrixMode: (rangeSelectMode ==='enddate' ? 'RANGE' : 'SINGLE'),  // will be updated to RANGE upon subsequent selects (or if user select ToDate first)
            matrixDisabled: false,
            rangeSelectMode: rangeSelectMode,
            cls: 'matrix-cal',
            itemId: myViewConfig.matrixRef,
            reference: myViewConfig.matrixRef,
            disableFn: function(cellDate, matrixCont){
                // When selecting enddates, disable dates prior to start date.  When selecting start dates, disable after enddate
                var today= Ext.Date.clearTime(new Date(Date(Ext.Date.now())), true);
                var retRangeSelectMode =  matrixCont.getRangeSelectMode();
                if (retRangeSelectMode === 'startdate' && !Ext.isEmpty(matrixCont.rangeDt2)){
                    return (cellDate > matrixCont.rangeDate2);
                }
                if (retRangeSelectMode === 'enddate' || !Ext.isEmpty(matrixCont.rangeDt1)){
                    return (cellDate < matrixCont.rangeDate1);
                }
                return false;
            },
            customClsFn: function(cellDate, matrixCont){ // Special styling for prior selected days
                var customCls = '';
                if (matrixCont.priorDate && +Ext.Date.clearTime(matrixCont.priorDate, true) === +Ext.Date.clearTime(cellDate, true)) {
                    customCls = 'priordate';
                }
                return customCls;
            },
            myViewConfig: myViewConfig          
        });

        var cal = Ext.create('Ext.ux.CalendarMatrix.CalendarMatrix', calCfg);

// Proceed to replace default buttons with arrows that match monthpicker and call mixin methods for navigation so that we have easy means
// to allow user to override if needed    
    var calGridToolBar = cal.down('#calGridToolBar');
    
    var priorCalGridMatrix = cal.down('#priorCalGridMatrix');
    calGridToolBar.remove(priorCalGridMatrix, true);
    calGridToolBar.insert(0, {
                    xtype: 'button',
                    itemId: 'priorCalGridMatrix',
                    reference: 'priorCalGridMatrix',
                    cls: 'x-monthpicker-yearnav-button x-monthpicker-yearnav-prev cal-grid-prior-btn-datefieldmixin',    
                    iconCls: '',   
          ui: 'plain',          
                    text: '',
          calendarMatrix: cal,
                    listeners: {
            scope: me,
                        click: 'onDateFieldMixinPriorClick'
                    }
    });

    var nextCalGridMatrix = cal.down('#nextCalGridMatrix');   
    calGridToolBar.remove(nextCalGridMatrix, true);
    calGridToolBar.add({
                    xtype: 'button',
                    itemId: 'nextCalGridMatrix',
                    reference: 'nextCalGridMatrix',
                    cls: 'x-monthpicker-yearnav-button x-monthpicker-yearnav-next cal-grid-next-btn-datefieldmixin',    
                    iconCls: '',   
          ui: 'plain',          
                    text: '',
          calendarMatrix: cal,
                    listeners: {
            scope: me,
                        click: 'onDateFieldMixinNextClick'
                    }
    });

        cal.mon(cal, 'calendarselect', me.handleSelectMixin, me);
        cal.mon(cal, 'mouseover', me.onCalendarMouseOverMixin, me);
        cal.mon(cal, 'monthnav', me.handleMonthNavMixin, me);

        myWindow.add(cal);
        
        return cal;
    }, 

    handleSelectMixin: function(calendarMatrix, selDt, selDate, selVal) {
        var me=this,
            rangeDt1, rangeDt2, rangeDate1_fmt, rangeDate2_fmt, celleditor,
            rangeSelectMode = calendarMatrix.getRangeSelectMode(),
            myViewConfig = calendarMatrix.myViewConfig,
            myWindow = me.getView()[myViewConfig.windowNm],
            startMonthIdx =  calendarMatrix.getStartMonthIdx(),
            matrixMode = calendarMatrix.getMatrixMode();

        rangeDt1 = calendarMatrix.rangeDt1;
        rangeDt2 = calendarMatrix.rangeDt2;
        calendarMatrix.priorDate = null;

        if (matrixMode==='SINGLE'){
            if (myViewConfig.cellEditMode){myViewConfig.record.set(myViewConfig.fromDataIndex, selDate);}
            else{me.lookupReference(myViewConfig.fromRef).setValue(selDate);}
              
            calendarMatrix.rangeDate1 = selDate;
            calendarMatrix.rangeDt1 = selDt;
        }
        if (matrixMode==='RANGE' ){
            if (myViewConfig.cellEditMode){myViewConfig.record.set(myViewConfig.fromDataIndex, calendarMatrix.rangeDate1);}
            else{me.lookupReference(myViewConfig.fromRef).setValue(calendarMatrix.rangeDate1);}
                        
           if (myViewConfig.toRef){    
              if (myViewConfig.cellEditMode){myViewConfig.record.set(myViewConfig.toDataIndex, calendarMatrix.rangeDate2);}
              else{me.lookupReference(myViewConfig.toRef).setValue(calendarMatrix.rangeDate2);}                     
           } 
        }
        if (rangeSelectMode==='enddate' && Ext.isEmpty(rangeDt1)){
            // auto-select start date button and redisplay calendar to accept start date
            me.onFromDtMixin(me.lookupReference(myViewConfig.fromRef));
        }
        else {
            if (myViewConfig.toRef){            
               me.lookupReference(myViewConfig.toRef).removeCls('date-input-selected');
            }
            me.lookupReference(myViewConfig.fromRef).removeCls('date-input-selected');
            myWindow.setHidden(true);
            
            if (myViewConfig.cellEditMode){  // Refocus edit of last cell
               celleditor = myViewConfig.lastDatefield.ownerCt.editingPlugin;
               celleditor.startEdit(myViewConfig.record, myViewConfig.lastDatefield.column);
            }

        }
    },

    onCalendarMouseOverMixin: function(matrix, selDate) {
        var me=this, i, matrixItem, calendarMatrix = matrix.matrixCont,
             rangeSelectMode = calendarMatrix.getRangeSelectMode(),
             selDt = Ext.Date.format(selDate, 'Y-m-d');

        if ((rangeSelectMode==='startdate' && Ext.isEmpty(calendarMatrix.rangeDt2)) ||
            (rangeSelectMode==='enddate'   && Ext.isEmpty(calendarMatrix.rangeDt1)) ||
            (rangeSelectMode==='enddate'   && selDt === calendarMatrix.rangeDt1)  ||
            (rangeSelectMode==='startdate' && selDt === calendarMatrix.rangeDt2)
           ){
            return;
        }

        if (rangeSelectMode==='enddate'){
            calendarMatrix.rangeDate2 = selDate;
            calendarMatrix.rangeDt2 = Ext.Date.format(selDate, 'Y-m-d');
        }
        else {
            calendarMatrix.rangeDate1 = selDate;
            calendarMatrix.rangeDt1 = Ext.Date.format(selDate, 'Y-m-d');
        }

        // refresh all matrix calendars based on selected range
        for (i=0; i<calendarMatrix.matrix.length; i++){
            matrixItem = calendarMatrix.down('#'+calendarMatrix.matrix[i].itemId+'_mc');
            matrixItem.fullUpdate(selDate);
        }
    },

    windCloseMixin: function(window, eOpts) {
        var me = this, 
            myViewConfig = window.myViewConfig;     
            
        me.lookupReference(myViewConfig.fromRef).removeCls('date-input-selected');
        if (myViewConfig.toRef){        
           me.lookupReference(myViewConfig.toRef).removeCls('date-input-selected');
        }
        
        if (myViewConfig.cellEditMode){  // Refocus edit of last cell
           celleditor = myViewConfig.lastDatefield.ownerCt.editingPlugin;
           celleditor.startEdit(myViewConfig.record, myViewConfig.lastDatefield.column);
        }        
    },

    onResetBtnMixinClick: function(button, e, eOpts) {
        var me=this, myWindow, calendarMatrix,
            dateFieldMixinConfig = button.dateFieldMixinConfig,
            myViewRef = dateFieldMixinConfig.fromRef,  // Embed fromRef in config name
            myViewConfigNm = myViewRef + 'ViewConfig',
            myViewConfig = me.getView()[myViewConfigNm];

        if (myViewConfig) {
            myWindow = me.getView()[myViewConfig.windowNm];
            if (myWindow){
                calendarMatrix = myWindow.down('#'+myViewConfig.matrixRef);
                calendarMatrix.resetMatrix();
            }
            me.lookupReference(myViewConfig.fromRef).setValue(myWindow ? calendarMatrix.rangeDate1 : null);
            me.lookupReference(myViewConfig.fromRef).clearInvalid();
            if (myViewConfig.toRef){
               me.lookupReference(myViewConfig.toRef).setValue(myWindow ? calendarMatrix.rangeDate2 : null);
               me.lookupReference(myViewConfig.toRef).clearInvalid();
            }
        }
    },

  prepDtMixin: function(datefield, myViewConfigNm, fieldType) {
    var me = this, el,
            myViewConfig = me.getView()[myViewConfigNm];
      
        if (!myViewConfig){
           myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(datefield.dateFieldMixinConfig,
               {
                 // Following configs should be defined for both from and to date fields if overridden as we don't know what field user will define first
                 windowNm : datefield.dateFieldMixinConfig.fromRef + 'Window',
                 windowCls : 'datefield-mixin-window',
                 matrixRef : datefield.dateFieldMixinConfig.fromRef + 'CalendarMatrix',
                 offset : {x: 15, y: 15},
                 width: 688,  // Width, Height based on current theme (Crisp) and number of columns (3) ..  override for individual implementations
                 height: 300
               });
           
           myViewConfig.lastDatefield = datefield;
           myViewConfig.myController = me;
        }
        else {
          // Merge any new configs for current fieldType not already defined (i.e. toDt field could have custom "toDt-specific" configs)
          myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(myViewConfig, datefield.dateFieldMixinConfig);
        }   
    
    // If this is a toDt field, merge any non-defined configs from fromDt field (this way user only has to define configs common to both just once.. 
    // Exception: fromRef, toRef (and cellEditMode for grids) configs required in both
    if (fieldType === 'enddate'){
      if (myViewConfig.cellEditMode){
              myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(myViewConfig, 
                                                       me.lookupReference(myViewConfig.fromRef).getEditor().dateFieldMixinConfig);
      }
      else {
              myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(myViewConfig, 
                                                       me.lookupReference(myViewConfig.fromRef).dateFieldMixinConfig);      
      }       
      // Now default toDt window title if not already defined
      myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(myViewConfig, {windowToTitle: 'Select To Date'});
    }   

    if (myViewConfig.cellEditMode){
            myViewConfig.record = datefield.ownerCt.context.record;
    }
    
    if (!datefield.validator){
      datefield.validateOnChange = false;
      datefield.validateOnBlur = true;

      datefield.validator = function(value) {  
       
          var me = this, toDt, fromDt, toDate, fromDate, isToDt, isFromDt, testVal;
          

          // Validate date entry itself
          if (!Ext.isEmpty(value)){
              testVal = me.parseDate(value);
              if (!testVal) {
                  return value + ' is not a valid date - it must be in the format ' + Ext.Date.unescapeFormat(me.format);
              }    
          }      
         
          if (!myViewConfig.toRef){return true;}
  
          // Handle date format conversion if necessary to convert to YYYY-mm-dd
          value = Ext.Date.format(Ext.Date.parse(value, me.format), 'Y-m-d');

          toDt = myViewConfig.myController.lookupReference(myViewConfig.toRef);
          fromDt = myViewConfig.myController.lookupReference(myViewConfig.fromRef);
          if (me.column){ // Grid implementation
              isToDt = (toDt.dataIndex === me.column.dataIndex)
              isFromDt = (fromDt.dataIndex === me.column.dataIndex)
          }
          else {
              isToDt = (toDt.reference === me.reference)
              isFromDt = (fromDt.reference === me.reference)          
          }
  
          if (myViewConfig.cellEditMode){
              myViewConfig.record = me.ownerCt.editingPlugin.context.record;
              toDate = Ext.Date.format(myViewConfig.record.get(toDt.dataIndex), 'Y-m-d');
              fromDate = Ext.Date.format(myViewConfig.record.get(fromDt.dataIndex), 'Y-m-d');
          }
          else {
              toDate = Ext.Date.format(toDt.getValue(), 'Y-m-d'); 
              fromDate = Ext.Date.format(fromDt.getValue(), 'Y-m-d'); 
          }       
 
          if (!Ext.isEmpty(toDate) && ((isToDt && value < fromDate) || (isFromDt && value > toDate))) {
              if (myViewConfig.cellEditMode){
                  Ext.MessageBox.show({
                    title: 'Alert',
                    msg: 'From Date can not be greater than To Date',
                    icon: Ext.MessageBox.INFO,
                    buttons: Ext.Msg.OK
                  });
              }
              return 'From Date can not be greater than To Date';
          }
          else {
            if (toDt.clearInvalid){toDt.clearInvalid();}  // Custom logic from Grid Cell edit scenarios
            if (fromDt.clearInvalid){fromDt.clearInvalid();}
          }
          return true;
      };    
    }   

    // Recompute position particularly for grid implementations
    el = datefield.getEl();
    myViewConfig.offset.x_adj = el.getX()+myViewConfig.offset.x;
    myViewConfig.offset.y_adj = el.getY()+el.getHeight()+myViewConfig.offset.y;
    // Override position if window will not fit on screen
    if ((window.innerWidth - myViewConfig.width) < myViewConfig.offset.x_adj){myViewConfig.offset.x_adj = window.innerWidth - myViewConfig.width - 20;}
    if (window.innerHeight < (myViewConfig.offset.y_adj + myViewConfig.height)){
        myViewConfig.offset.y_adj = el.getY() - myViewConfig.height - 20;
    } 
    me.getView()[myViewConfigNm] = myViewConfig;
    
    return myViewConfig;
  },    

  onDatefieldFocusMixin: function(datefield) {
    // Only needed for range date implementations
    // Primarily used to initialize validator if not defined should user type in date before using picker
    // If defining own validator then no need to listen for focus event 
        var me = this, 
            myViewRef = datefield.dateFieldMixinConfig.fromRef,  // Embed fromRef in config name
            myViewConfigNm = myViewRef + 'ViewConfig',
      myViewConfig = me.getView()[myViewConfigNm];
      
    if (!myViewConfig){
        me.prepDtMixin(datefield, myViewConfigNm);
      }
  },

  onFromDtMixin: function(datefield) {
        var me = this, el, x, y, myWindow, calendarMatrix, matrixMode, matrixMode, myStartMonthIdx, today, centerWindow=false,
            priorDate = datefield.getValue(),
            toDate,
            myViewRef = datefield.dateFieldMixinConfig.fromRef,  // Embed fromRef in config name
            myViewConfigNm = myViewRef + 'ViewConfig',
            myViewConfig;

        datefield.dateFieldMixinConfig = Ext.applyIf(datefield.dateFieldMixinConfig, {windowFromTitle : 'Select From Date:'});

    myViewConfig = me.prepDtMixin(datefield, myViewConfigNm, 'startdate');

        if (myViewConfig.cellEditMode){
            myViewConfig.fromDataIndex = me.lookupReference(myViewConfig.fromRef).dataIndex;
            if (myViewConfig.toRef){myViewConfig.toDataIndex = me.lookupReference(myViewConfig.toRef).dataIndex;}
            toDate = myViewConfig.toRef ? myViewConfig.record.get(myViewConfig.toDataIndex) : null;
        }
        else {
            toDate = myViewConfig.toRef ? me.lookupReference(myViewConfig.toRef).getValue() : null; 
            datefield.addCls('date-input-selected');
        }

        if (myViewConfig.toRef){            
           me.lookupReference(myViewConfig.toRef).removeCls('date-input-selected');
        }
          
        today= Ext.Date.clearTime(new Date(Date(Ext.Date.now())), true);
        myStartMonthIdx = priorDate ? 
                          Ext.Date.diff(Ext.Date.clearTime(Ext.Date.getFirstDateOfMonth(today), true), priorDate, Ext.Date.MONTH) :
                          (!Ext.isEmpty(myViewConfig.startMonthIdx) ? myViewConfig.startMonthIdx : -1);

        myWindow = me.getView()[myViewConfig.windowNm];
        if (!myWindow){   
            myViewConfig.startMonthIdx = myStartMonthIdx;
            calendarMatrix = me.createWindowMixin('startdate', myViewConfig, myViewConfig.windowFromTitle);
            myWindow = me.getView()[myViewConfig.windowNm];
            if (myViewConfig.offset.y_adj<0) {myWindow.show();}
            else {myWindow.showAt(myViewConfig.offset.x_adj, myViewConfig.offset.y_adj, {duration: 100});}
            
        }
        else {
            calendarMatrix = myWindow.down('#'+myViewConfig.matrixRef);
            calendarMatrix.selectedValues = calendarMatrix.selectedDts = [];  // Clear single select mode
            calendarMatrix.setMatrixMode('RANGE');
            calendarMatrix.setRangeSelectMode('startdate');
            calendarMatrix.setStartMonthIdx(myStartMonthIdx);
            calendarMatrix.dispCalGrid();
            myWindow.setTitle(myViewConfig.windowFromTitle);
            if (myWindow.isHidden()){
                if (myViewConfig.offset.y_adj<0) {myWindow.show();}
                else {myWindow.showAt(myViewConfig.offset.x_adj, myViewConfig.offset.y_adj);}                
            }
        }

        // Logic to update matrix with manually updated date
        matrixMode = calendarMatrix.getMatrixMode();
        rangeSelectMode = calendarMatrix.getRangeSelectMode();
        calendarMatrix.priorDate = priorDate;

        if (priorDate && toDate){
            calendarMatrix.setMatrixMode('RANGE');
            calendarMatrix.setRangeSelectMode('startdate');
            calendarMatrix.rangeDate1 = priorDate;
            calendarMatrix.rangeDt1 = Ext.Date.format(priorDate, 'Y-m-d');
            calendarMatrix.rangeDate2 = toDate;
            calendarMatrix.rangeDt2 = Ext.Date.format(toDate, 'Y-m-d');
            calendarMatrix.dispCalGrid();
        }
        else if (priorDate && matrixMode === 'SINGLE'){
            calendarMatrix.setMatrixMode('RANGE');
            calendarMatrix.setRangeSelectMode('startdate');
            calendarMatrix.rangeDate1 = priorDate;
            calendarMatrix.rangeDt1 = Ext.Date.format(priorDate, 'Y-m-d');
            calendarMatrix.dispCalGrid();
        }
        else if (matrixMode === 'RANGE' && rangeSelectMode==='startdate' &&  priorDate !== calendarMatrix.rangeDate1){
            calendarMatrix.rangeDate1 = priorDate;
            calendarMatrix.rangeDt1 = Ext.Date.format(priorDate, 'Y-m-d');
            calendarMatrix.dispCalGrid();
        }
    
    me.handleMonthNavMixin(calendarMatrix); 
    },

    onToDtMixin: function(datefield) {
        var me = this, el, x, y, myWindow, calendarMatrix, myStartMonthIdx, today, centerWindow=false,
            priorDate = datefield.getValue(),
            fromDate,
            myViewRef = datefield.dateFieldMixinConfig.fromRef,  // Embed fromRef in config name
            myViewConfigNm = myViewRef + 'ViewConfig',
            myViewConfig;

    myViewConfig = me.prepDtMixin(datefield, myViewConfigNm, 'enddate');

        if (myViewConfig.cellEditMode){
            myViewConfig.toDataIndex = me.lookupReference(myViewConfig.toRef).dataIndex;
            if (myViewConfig.fromRef){myViewConfig.fromDataIndex = me.lookupReference(myViewConfig.fromRef).dataIndex;}            
            fromDate = myViewConfig.fromRef ? myViewConfig.record.get(myViewConfig.fromDataIndex) : null;
        }
        else {
            fromDate = myViewConfig.fromRef ? me.lookupReference(myViewConfig.fromRef).getValue() : null; 
            datefield.addCls('date-input-selected');
        } 

        me.lookupReference(myViewConfig.fromRef).removeCls('date-input-selected');
        
        today= Ext.Date.clearTime(new Date(Date(Ext.Date.now())), true);
        myStartMonthIdx = priorDate ? 
                          (Ext.Date.diff(Ext.Date.clearTime(Ext.Date.getFirstDateOfMonth(today), true), priorDate, Ext.Date.MONTH)-
                            (myViewConfig.numCols ? myViewConfig.numCols-1 : 2)) :  /* Adjust ToDate to line up with rightmost calendar */
                          (!Ext.isEmpty(myViewConfig.startMonthIdx) ? myViewConfig.startMonthIdx : -1);
        
        myWindow = me.getView()[myViewConfig.windowNm];        
        if (!myWindow){
            myViewConfig.startMonthIdx = myStartMonthIdx;         
            calendarMatrix = me.createWindowMixin('enddate', myViewConfig, myViewConfig.windowToTitle);
            myWindow = me.getView()[myViewConfig.windowNm];
            if (myViewConfig.offset.y_adj<0) {myWindow.show();}
            else {myWindow.showAt(myViewConfig.offset.x_adj, myViewConfig.offset.y_adj, {duration: 100});}        
        }
        else {
            calendarMatrix = myWindow.down('#'+myViewConfig.matrixRef);
            calendarMatrix.selectedValues = calendarMatrix.selectedDts = [];  // Clear single select mode
            calendarMatrix.setMatrixMode('RANGE');
            calendarMatrix.setRangeSelectMode('enddate');
            calendarMatrix.setStartMonthIdx(myStartMonthIdx);            
            calendarMatrix.dispCalGrid();
            myWindow.setTitle(myViewConfig.windowToTitle);
            if (myWindow.isHidden()){
               if (myViewConfig.offset.y_adj<0) {myWindow.show();}
               else {myWindow.showAt(myViewConfig.offset.x_adj, myViewConfig.offset.y_adj);}
            }
        }

        // Logic to update matrix with manually updated date
        calendarMatrix.priorDate = priorDate;
        if (priorDate && fromDate){
            calendarMatrix.rangeDate2 = priorDate;
            calendarMatrix.rangeDt2 = Ext.Date.format(priorDate, 'Y-m-d');
            calendarMatrix.rangeDate1 = fromDate;
            calendarMatrix.rangeDt1 = Ext.Date.format(fromDate, 'Y-m-d');
            calendarMatrix.dispCalGrid();
        }
        else if (priorDate !== calendarMatrix.rangeDate2){
            calendarMatrix.rangeDate2 = priorDate;
            calendarMatrix.rangeDt2 = Ext.Date.format(priorDate, 'Y-m-d');
            calendarMatrix.dispCalGrid();
        }
    
    me.handleMonthNavMixin(calendarMatrix);   
    },
  
    onDateFieldMixinPriorClick: function(button, e, eOpts) {
        var me = this, calendarMatrix = button.calendarMatrix;
    me.handleMonthNavMixin(calendarMatrix, -1)
    },
        
    onDateFieldMixinNextClick: function(button, e, eOpts) {
        var me = this, calendarMatrix = button.calendarMatrix;
    me.handleMonthNavMixin(calendarMatrix, 1)
    },  
  
    handleMonthNavMixin: function(calendarMatrix, multiplier) {
    // Redisplay calendar matrix based on multiplier (if non-zero) and handle hide/show of next/prev month icons
  // If selecting start date, don't allow future month navigation past end date month
  // If selecting end date, don't allow prior month navigation prior to start date month
        var me = this,
            startMonthIdx, lastMatrixItem, firstMatrixItem,
      myViewConfig = calendarMatrix.myViewConfig,
      myWindow = me.getView()[myViewConfig.windowNm],
            rangeSelectMode = calendarMatrix.getRangeSelectMode(),
      priorCalGridMatrix = myWindow.down('#priorCalGridMatrix'),
      nextCalGridMatrix = myWindow.down('#nextCalGridMatrix'),
      fromDt = me.lookupReference(myViewConfig.fromRef);

    multiplier = multiplier ?  multiplier : 0;
        calendarMatrix.setStartMonthIdx(calendarMatrix.getStartMonthIdx() + (multiplier* calendarMatrix.numMonths));
    if (multiplier !== 0){
      calendarMatrix.dispCalGrid();
    }

        startMonthIdx =  calendarMatrix.getStartMonthIdx();
        firstMatrixItem = calendarMatrix.down('#'+calendarMatrix.matrix[0].itemId+'_mc');
        lastMatrixItem = calendarMatrix.down('#'+calendarMatrix.matrix[calendarMatrix.matrix.length-1].itemId+'_mc');

    // Reset
        priorCalGridMatrix.setVisible(true);
        nextCalGridMatrix.setVisible(true);

        if (rangeSelectMode==='enddate' && !Ext.isEmpty(calendarMatrix.rangeDt1) &&
            calendarMatrix.rangeDate1 > firstMatrixItem.minDate){
              priorCalGridMatrix.setVisible(false);
        }
        if (rangeSelectMode==='startdate' && !Ext.isEmpty(calendarMatrix.rangeDt2) &&
            calendarMatrix.rangeDate2 < lastMatrixItem.maxDate){
              nextCalGridMatrix.setVisible(false);
        }

    fromDt.fireEvent('handlemonthnav', fromDt, myViewConfig, calendarMatrix, myWindow, 
                     priorCalGridMatrix, nextCalGridMatrix, firstMatrixItem, lastMatrixItem);
    }
});
  