Ext.define('Ext.ux.CalendarMatrix.DateMatrixPickerExtension', {
    extend: 'Ext.picker.Date',
    alias: 'widget.dateMatrixPickerExtension',

    layout: 'auto',

    initComponent: function() {
        var me = this;
        //Extend Ext.picker.Date for calendar matrix purposes

        me.callParent(arguments);
    },

    fullUpdate: function(date) {
        date = this.minDate;  // Override for CalendarMatrix implementation to handle final render pass

        var me = this,
            cells = me.cells.elements,
            textNodes = me.textNodes,
            disabledCls = me.disabledCellCls,
            eDate = Ext.Date,
            i = 0,
            extraDays = 0,
            newDate = 0, // +eDate.clearTime(date, true),  // DISABLE functionality to highlight passed date as selected for CalendarMatrix            
            today = +eDate.clearTime(new Date()),
            min = me.minDate ? eDate.clearTime(me.minDate, true) : Number.NEGATIVE_INFINITY,
            max = me.maxDate ? eDate.clearTime(me.maxDate, true) : Number.POSITIVE_INFINITY,
            ddMatch = me.disabledDatesRE,
            ddText = me.disabledDatesText,
            ddays = me.disabledDays ? me.disabledDays.join('') : false,
            ddaysText = me.disabledDaysText,
            format = me.format,
            days = eDate.getDaysInMonth(date),
            firstOfMonth = eDate.getFirstDateOfMonth(date),
            startingPos = firstOfMonth.getDay() - me.startDay,
            previousMonth = eDate.add(date, eDate.MONTH, -1),
            ariaTitleDateFormat = me.ariaTitleDateFormat,
            prevStart, current, disableToday, tempDate, setCellClass, html, cls,
            formatValue, value;
            
        // Added for integration with matrixCalendar
        var rangeDate1 = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.rangeDate1,
            rangeDate2 = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.rangeDate2,
            selectedCls = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.selectedCls,
            rangeStartDtCls = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getRangeStartDtCls(),
            rangeEndDtCls = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getRangeEndDtCls(),
            rangeSelectMode = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getRangeSelectMode(),
            rangeStartDateModeCls = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getRangeStartDateModeCls(),
            rangeEndDateModeCls = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getRangeEndDateModeCls(),
            disabledValues = Ext.isEmpty(me.matrixCont.disabledValues) ? [] : me.matrixCont.disabledValues,
            disabledMatrixDts = disabledValues.length === 0 ? null : me.matrixCont.getDisabledMatrixDts(),
            priorValues = Ext.isEmpty(me.matrixCont.priorValues) ? [] : me.matrixCont.priorValues,
            priorMatrixDts = priorValues.length === 0 ? null : me.matrixCont.getPriorMatrixDts(),
            disableFn = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getDisableFn(),
            customClsFn = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getCustomClsFn(),
            priorMatrixDts = priorValues.length === 0 ? null : me.matrixCont.getPriorMatrixDts(),
            dtIdx,
            selectedValues = Ext.isEmpty(me.matrixCont.selectedValues) ? [] : me.matrixCont.selectedValues,
			monthTextFn = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getMonthTextFn();

        if (startingPos < 0) {
            startingPos += 7;
        }

        days += startingPos;
        prevStart = eDate.getDaysInMonth(previousMonth) - startingPos;
        current = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), prevStart, 0); // me.initHour);  // overridden for matrixCalendar

        if (me.showToday) {
            tempDate = eDate.clearTime(new Date());
            disableToday = (tempDate < min || tempDate > max ||
                (ddMatch && format && ddMatch.test(eDate.dateFormat(tempDate, format))) ||
                (ddays && ddays.indexOf(tempDate.getDay()) != -1));

            if (!me.disabled) {
                me.todayBtn.setDisabled(disableToday);
            }
        }

        setCellClass = function(cellIndex, cls){
            var cell = cells[cellIndex];
            
            value = +eDate.clearTime(current, true);
            cell.setAttribute('aria-label', eDate.format(current, ariaTitleDateFormat));
            // store dateValue number as an expando
            cell.firstChild.dateValue = value;
            if (value == today && Ext.Date.format(date, 'Ym')===Ext.Date.format(new Date(), 'Ym')){  // OVERRIDE for CalendarMatrix
                cls += ' ' + me.todayCls;
                cell.firstChild.title = me.todayText;
                
                // Extra element for ARIA purposes
                me.todayElSpan = Ext.DomHelper.append(cell.firstChild, {
                    tag: 'span',
                    cls: Ext.baseCSSPrefix + 'hidden-clip',
                    html: me.todayText
                }, true);
            }
            if (value == newDate) {
            	// This logic not utilized for CalendarMatrix 
                me.activeCell = cell;
                me.eventEl.dom.setAttribute('aria-activedescendant', cell.id);
                cell.setAttribute('aria-selected', true);
                cls += ' ' + me.selectedCls;
                me.fireEvent('highlightitem', me, cell);
            } else {
                cell.setAttribute('aria-selected', false);
            }
            
            // Initialize for below
            cell.style.backgroundColor = '';

            // Added for integration with CalendarMatrix for prior categories which can not be overwritten by selection
            dtIdx = disabledValues.indexOf(value);
            if (current < min || current > max){
                // Do not apply custom highlighting if outside current month
            }
            else if (dtIdx !== -1){
                if (!Ext.isEmpty(disabledMatrixDts[dtIdx].cls)){
                    cls += ' ' + disabledMatrixDts[dtIdx].cls;
                }
                if (!Ext.isEmpty(disabledMatrixDts[dtIdx].backgroundColor)){
                    cell.style.backgroundColor = disabledMatrixDts[dtIdx].backgroundColor;
                }
            }
      
            else if (disableFn && disableFn(current, me.matrixCont)){
                    cls += ' ' + me.disabledCellCls;
            }

            // Added for integration with CalendarMatrix for range selection
            else   if (!Ext.isEmpty(rangeDate1) && !Ext.isEmpty(rangeDate2) &&
                       value >= +eDate.clearTime(rangeDate1, true) && value <= +eDate.clearTime(rangeDate2, true)){
                cls += ' ' + selectedCls;
                if (value == +eDate.clearTime(rangeDate1, true)){cls += ' ' + rangeStartDtCls;}
                else if (value == +eDate.clearTime(rangeDate2, true)){cls += ' ' + rangeEndDtCls;}
            }
            else   if (!Ext.isEmpty(rangeDate1) && Ext.isEmpty(rangeDate2) &&
                       value == +eDate.clearTime(rangeDate1, true)){
                cls += ' ' + selectedCls + ' ' + rangeStartDtCls;
            }
            else   if (Ext.isEmpty(rangeDate1) && !Ext.isEmpty(rangeDate2) &&
                       value == +eDate.clearTime(rangeDate2, true)){
                cls += ' ' + selectedCls + ' ' + rangeEndDtCls;
            }
                        
            // Added for integration with CalendarMatrix for single and multi-selection
            else if (selectedValues.indexOf(value) !== -1){
                cls += ' ' + selectedCls;
            }


            // Added for integration with CalendarMatrix for prior categories which could be overwritten
            else if (priorValues.indexOf(value) !== -1){
                dtIdx = priorValues.indexOf(value);
                if (!Ext.isEmpty(priorMatrixDts[dtIdx].cls)){
                    cls += ' ' + priorMatrixDts[dtIdx].cls;
                }
                if (!Ext.isEmpty(priorMatrixDts[dtIdx].backgroundColor)){
                    cell.style.backgroundColor = priorMatrixDts[dtIdx].backgroundColor;
                }
            }            

            if (value < min) {
                cls += ' ' + disabledCls;
                cell.setAttribute('aria-label', me.minText);
            }
            else if (value > max) {
                cls += ' ' + disabledCls;
                cell.setAttribute('aria-label', me.maxText);
            }
            else if (ddays && ddays.indexOf(current.getDay()) !== -1){
                cell.setAttribute('aria-label', ddaysText);
                cls += ' ' + disabledCls;
            }
            else if (ddMatch && format){
                formatValue = eDate.dateFormat(current, format);
                if(ddMatch.test(formatValue)){
                    cell.setAttribute('aria-label', ddText.replace('%0', formatValue));
                    cls += ' ' + disabledCls;
                }
            }
            
            if (rangeSelectMode==='startdate' && !Ext.isEmpty(rangeStartDateModeCls)){
            	  cls += ' ' + rangeStartDateModeCls;
            }
            if (rangeSelectMode==='enddate' && !Ext.isEmpty(rangeEndDateModeCls)){
            	  cls += ' ' + rangeEndDateModeCls;
            }  
                    
            if (customClsFn){
                // Custom classes added after all others
                cls += ' ' + customClsFn(current);
            }
            cell.className = cls + ' ' + me.cellCls;
        };

        for(; i < me.numDays; ++i) {
            if (i < startingPos) {
                html = (++prevStart);
                cls = me.prevCls;
            } else if (i >= days) {
                html = (++extraDays);
                cls = me.nextCls;
            } else {
                html = i - startingPos + 1;
                cls = me.activeCls;
            }
            current.setDate(current.getDate() + 1);
            textNodes[i].innerHTML = me.customCellHtml(cls, html, current);            
            setCellClass(i, cls);
        }

        // Prevent override of text updated during custom initial render event processing for CalendarMatrix
        if (Ext.isEmpty(me.monthBtn.getText())){
            me.monthBtn.setText(Ext.isEmpty(monthTextFn) ? Ext.Date.format(date, me.monthYearFormat) : monthTextFn(date));
        }
    },

    customCellHtml: function(cls, dayNum, cellDate) {
        var me = this, html = dayNum;
        var overrideCellHtmlFn = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getOverrideCellHtmlFn();
        if (overrideCellHtmlFn){
          html = overrideCellHtmlFn.call(me, cls, dayNum, cellDate);
        }
        return html;
    },
    
    update: function(date, forceRefresh) {
      var me = this;
  
      if (me.rendered) {
          me.fullUpdate(date); // Always do full update for Calendar Matrix
      }
      return me;
    },
  
    doShowMonthPicker: function(button, e, eOpts) {
        // Disable original month dropdown picker method for CalendarMatrix
    	  var me = this;
    	  me.fireEvent('monthselect', me, me.minDate, me.maxDate);  	
    },

    handleDateClick: function(e, t) {
        var me = this,
            handler = me.handler,

            // Added variables for CalendarMatrix
            cls = me.selectedCls,
            rangeStartDtCls = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getRangeStartDtCls(),
            rangeEndDtCls = Ext.isEmpty(me.matrixCont) ? '' : me.matrixCont.getRangeEndDtCls(),
            cells,
            matrixCont = me.matrixCont,
            matrix = matrixCont.matrix,
            i, calItem;
            
        e.stopEvent();
        if(!me.disabled && t.dateValue && !Ext.fly(t.parentNode).hasCls(me.disabledCellCls)){
          
            // De-select prior selected dates by removing selected cls across all CalendarMatrix cells
            for (i=0; i< matrix.length; i++){
                calItem = matrixCont.down('#'+matrix[i].itemId+'_mc');
                cells   = calItem.cells;
                cells.removeCls(cls);
                if (!Ext.isEmpty(rangeStartDtCls)){cells.removeCls(rangeStartDtCls);}         
                if (!Ext.isEmpty(rangeEndDtCls)){cells.removeCls(rangeEndDtCls);}         
            }
            me.setValue(new Date(t.dateValue));
            me.fireEvent('select', me, me.value);
            if (handler) {
                handler.call(me.scope || me, me, me.value);
            }
            // event handling is turned off on hide
            // when we are using the picker in a field
            // therefore onSelect comes AFTER the select
            // event.
            me.onSelect();
        }
    },
    
    onRender: function(container, position) {
        var me = this;

        me.callParent(arguments);

        me.cells = me.eventEl.select('tbody td');
        me.textNodes = me.eventEl.query('tbody td div');
        
        me.eventEl.set({ 'aria-labelledby': me.monthBtn.id });

        me.mon(me.eventEl, {
            scope: me,
            mousewheel: me.handleMouseWheel,
            click: {
                fn: me.handleDateClick,
                delegate: 'div.' + me.baseCls + '-date'
            },
            mouseover: {  // Added mouseover event for MatrixCalendar
                fn: me.handleDateMouseOver,
                delegate: 'div.' + me.baseCls + '-date'             
            }
        });
      
    },
    
    handleDateMouseOver: function(e, t) {
      // Fire 'mouseover' event for CalendarMatrix if not disabled
        var me = this
        e.stopEvent();
        if(!me.disabled && t.dateValue && !Ext.fly(t.parentNode).hasCls(me.disabledCellCls)){
            me.fireEvent('mouseover', me, new Date(t.dateValue));
        }
    },  
});