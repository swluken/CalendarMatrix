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
	     - listeners: {trigcalmatrix: 'onFromDtMixin'} for fromDate field  ... or {trigcalmatrix: 'onFromDtMixin'} for toDate field
	     - reference:  unique identifier for this view for each datefield 
	     - dateFieldMixinConfig: {
	       [required configs]
           fromRef: 'fromDt4',  
           toRef: 'toDt4',  
           cellEditMode: true  [required for grid cell editing only ... also see view initComponent() method for additional requirements]
           
         [optional configs]
           windowFromTitle: 'Select Begin Date:',
           windowToTitle: 'Select End Date:',
  	 	     windowNm : fromRef + 'Window',  // 
  	 	     windowCls : 'datefield-mixin-window',
  	 	     matrixRef : fromRef + 'CalendarMatrix',
  	 	     offset : {x: 15, y: 15},
  	 	     width: 688,  // Width, Height based on current theme and number of columns
  	 	     height: 300,
           Plus any config supported by CalendarMatrix...
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

        cal.mon(cal, 'calendarselect', me.handleSelectMixin, me);
        cal.mon(cal, 'mouseover', me.onCalendarMouseOverMixin, me);

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
               this.lookupReference(myViewConfig.toRef).removeCls('date-input-selected');
            }
            this.lookupReference(myViewConfig.fromRef).removeCls('date-input-selected');
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
    	      
        this.lookupReference(myViewConfig.fromRef).removeCls('date-input-selected');
        if (myViewConfig.toRef){        
           this.lookupReference(myViewConfig.toRef).removeCls('date-input-selected');
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
           calendarMatrix = myWindow.down('#'+myViewConfig.matrixRef);
           calendarMatrix.resetMatrix();
           me.lookupReference(myViewConfig.fromRef).setValue(calendarMatrix.rangeDate1);
           if (myViewConfig.toRef){
              me.lookupReference(myViewConfig.toRef).setValue(calendarMatrix.rangeDate2);
           }
        }
    },

    onFromDtMixin: function(datefield) {
        var me = this, el, x, y, myWindow, calendarMatrix, matrixMode, matrixMode, myStartMonthIdx, today, centerWindow=false,
            priorDate = datefield.getValue(),
            toDate,
            myViewRef = datefield.dateFieldMixinConfig.fromRef,  // Embed fromRef in config name
            myViewConfigNm = myViewRef + 'ViewConfig',
            myViewConfig = me.getView()[myViewConfigNm];

        datefield.dateFieldMixinConfig = Ext.applyIf(datefield.dateFieldMixinConfig, {windowFromTitle : 'Select From Date:'});
        if (!myViewConfig){
        	 myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(datefield.dateFieldMixinConfig,
        	     {
        	     	 // Following configs should be defined for both from and to date fields if overridden as we don't know what field user will define first
        	 	     windowNm : datefield.dateFieldMixinConfig.fromRef + 'Window',
        	 	     windowCls : 'datefield-mixin-window',
        	 	     matrixRef : datefield.dateFieldMixinConfig.fromRef + 'CalendarMatrix',
        	 	     offset : {x: 15, y: 15},
        	 	     width: 688,  // Width, Height based on current theme and number of columns
        	 	     height: 300
        	 	   });
        }
        else {
        	// Merge configs defined in fromDate field that weren't already defined in toDate field
        	myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(myViewConfig, datefield.dateFieldMixinConfig);
        }   
        myViewConfig.lastDatefield = datefield;

        if (myViewConfig.cellEditMode){
            myViewConfig.record = datefield.ownerCt.context.record;
            myViewConfig.fromDataIndex = this.lookupReference(myViewConfig.fromRef).dataIndex;
            if (myViewConfig.toRef){myViewConfig.toDataIndex = this.lookupReference(myViewConfig.toRef).dataIndex;}
       	    toDate = myViewConfig.toRef ? myViewConfig.record.get(myViewConfig.toDataIndex) : null;
        }
        else {
            toDate = myViewConfig.toRef ? this.lookupReference(myViewConfig.toRef).getValue() : null; 
            datefield.addCls('date-input-selected');
        }

        if (myViewConfig.toRef){            
           this.lookupReference(myViewConfig.toRef).removeCls('date-input-selected');
        }

        el = datefield.getEl();
        x = el.getX()+myViewConfig.offset.x;
        y = el.getY()+el.getHeight()+myViewConfig.offset.y;
        // Override position if window will not fit on screen
        if ((window.innerWidth - myViewConfig.width) < x){x = window.innerWidth - myViewConfig.width - 20;}
        if (window.innerHeight < (y + myViewConfig.height)){
        	  y = el.getY() - myViewConfig.height - 20;
        	  centerWindow = (y<0);
        }
        
        
        today= Ext.Date.clearTime(new Date(Date(Ext.Date.now())), true);
   	    myStartMonthIdx = priorDate ? 
   	                      Ext.Date.diff(Ext.Date.clearTime(Ext.Date.getFirstDateOfMonth(today), true), priorDate, Ext.Date.MONTH) :
   	                      (myViewConfig.startMonthIdx ? myViewConfig.startMonthIdx : -1);

        myWindow = me.getView()[myViewConfig.windowNm];
        if (!myWindow){
        	  myViewConfig.startMonthIdx = myStartMonthIdx;
            calendarMatrix = me.createWindowMixin('startdate', myViewConfig, myViewConfig.windowFromTitle);
            myWindow = me.getView()[myViewConfig.windowNm];
            if (centerWindow) {myWindow.show();}
            else {myWindow.showAt(x, y, {duration: 100});}
            
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
                if (centerWindow) {myWindow.show();}
                else {myWindow.showAt(x, y);}            	   
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
        else if (priorDate && matrixMode === 'RANGE' && rangeSelectMode==='startdate' &&  priorDate !== calendarMatrix.rangeDate1){
            calendarMatrix.rangeDate1 = priorDate;
            calendarMatrix.rangeDt1 = Ext.Date.format(priorDate, 'Y-m-d');
            calendarMatrix.dispCalGrid();
        }

    },

    onToDtMixin: function(datefield) {
        var me = this, el, x, y, myWindow, calendarMatrix, myStartMonthIdx, today, centerWindow=false,
            priorDate = datefield.getValue(),
            fromDate,
            myViewRef = datefield.dateFieldMixinConfig.fromRef,  // Embed fromRef in config name
            myViewConfigNm = myViewRef + 'ViewConfig',
            myViewConfig = me.getView()[myViewConfigNm];

        datefield.dateFieldMixinConfig = Ext.applyIf(datefield.dateFieldMixinConfig, {windowToTitle : 'Select To Date:'});
        if (!myViewConfig){
        	 myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(datefield.dateFieldMixinConfig,
        	     {
        	     	 // Following configs should be defined for both from and to date fields if overridden as we don't know what field user will define first        	     	
        	 	     windowNm : datefield.dateFieldMixinConfig.fromRef + 'Window',
        	 	     windowCls : 'datefield-mixin-window',
        	 	     matrixRef : datefield.dateFieldMixinConfig.fromRef + 'CalendarMatrix',
        	 	     offset : {x: 15, y: 15},
        	 	     width: 688,  // Width, Height based on current theme and number of columns
        	 	     height: 300  	 	     
        	 	   });
        }
        else {
           // Merge configs defined in toDate field that weren't already defined in fromDate field
        	 myViewConfig = me.getView()[myViewConfigNm] = Ext.applyIf(myViewConfig, datefield.dateFieldMixinConfig);
        }
        myViewConfig.lastDatefield = datefield;        

        if (myViewConfig.cellEditMode){
            myViewConfig.record = datefield.ownerCt.context.record;
            myViewConfig.toDataIndex = this.lookupReference(myViewConfig.toRef).dataIndex;
            if (myViewConfig.fromRef){myViewConfig.fromDataIndex = this.lookupReference(myViewConfig.fromRef).dataIndex;}            
      	    fromDate = myViewConfig.fromRef ? myViewConfig.record.get(myViewConfig.fromDataIndex) : null;
        }
        else {
            fromDate = myViewConfig.fromRef ? this.lookupReference(myViewConfig.fromRef).getValue() : null; 
            datefield.addCls('date-input-selected');
        }        

        this.lookupReference(myViewConfig.fromRef).removeCls('date-input-selected');

        el = datefield.getEl();
        x = el.getX()+myViewConfig.offset.x;
        y = el.getY()+el.getHeight()+myViewConfig.offset.y;
        // Override position if window will not fit on screen
        if ((window.innerWidth - myViewConfig.width) < x){x = window.innerWidth - myViewConfig.width - 20;}
        if (window.innerHeight < (y + myViewConfig.height)){
        	  y = el.getY() - myViewConfig.height - 20;
        	  centerWindow = (y<0);
        }
        
        today= Ext.Date.clearTime(new Date(Date(Ext.Date.now())), true);
   	    myStartMonthIdx = priorDate ? 
   	                      (Ext.Date.diff(Ext.Date.clearTime(Ext.Date.getFirstDateOfMonth(today), true), priorDate, Ext.Date.MONTH)-
   	                        (myViewConfig.numCols ? myViewConfig.numCols-1 : 2)) :  /* Adjust ToDate to line up with rightmost calendar */
   	                      (myViewConfig.startMonthIdx ? myViewConfig.startMonthIdx : -1);
        
        myWindow = me.getView()[myViewConfig.windowNm];        
        if (!myWindow){
        	  myViewConfig.startMonthIdx = myStartMonthIdx;        	
            calendarMatrix = me.createWindowMixin('enddate', myViewConfig, myViewConfig.windowToTitle);
            myWindow = me.getView()[myViewConfig.windowNm];
            if (centerWindow) {myWindow.show();}
            else {myWindow.showAt(x, y, {duration: 100});}        
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
               if (centerWindow) {myWindow.show();}
               else {myWindow.showAt(x, y);}
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
        else if (priorDate &&  priorDate !== calendarMatrix.rangeDate2){
            calendarMatrix.rangeDate2 = priorDate;
            calendarMatrix.rangeDt2 = Ext.Date.format(priorDate, 'Y-m-d');
            calendarMatrix.dispCalGrid();
        }
    }

});