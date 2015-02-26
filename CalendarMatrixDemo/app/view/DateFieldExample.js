/*
 * File: app/view/DateFieldExample.js
 *
 * This file was generated by Sencha Architect version 3.2.0.
 * http://www.sencha.com/products/architect/
 *
 * This file requires use of the Ext JS 5.1.x library, under independent license.
 * License of Sencha Architect does not include license for Ext JS 5.1.x. For more
 * details see http://www.sencha.com/license or contact license@sencha.com.
 *
 * This file will be auto-generated each and everytime you save your project.
 *
 * Do NOT hand edit this file.
 */

Ext.define('CalendarMatrix.view.DateFieldExample', {
    extend: 'Ext.container.Container',
    alias: 'widget.datefieldexample',

    requires: [
        'CalendarMatrix.view.DateFieldExampleViewModel',
        'CalendarMatrix.view.DateFieldExampleViewController',
        'Ext.form.Panel',
        'Ext.form.FieldSet',
        'Ext.form.field.Date',
        'Ext.button.Button',
        'Ext.grid.Panel',
        'Ext.view.Table',
        'Ext.grid.column.Date',
        'Ext.grid.column.Number',
        'Ext.grid.plugin.RowEditing',
        'Ext.form.field.Number',
        'Ext.grid.plugin.CellEditing'
    ],

    controller: 'CalendarMatrix.view.DateFieldExampleViewController',
    viewModel: {
        type: 'CalendarMatrix.view.DateFieldExampleViewModel'
    },
    cls: 'date-field-example',
    style: 'background-color: white; margin: 0px 5px;',

    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    items: [
        {
            xtype: 'container',
            html: 'Combination example of Single Date selection plus Range selection within Forms and Grids (row editing and cell editing).  It demonstrates custom implementation of CalendarMatrix utilizing Ext.form.field.Date which allows manual date input with validation, but where CalendarMatrix replaces the standard datepicker. DateFieldMixin.js is provided which demonstrates how a Mixin class can be used to simplify repetitive implementations of common functionality.  <br>- If both dates empty and user clicks on FromDate, then implement SINGLE selection mode (i.e. FromDate only style input) <br>- If both dates empty and user clicks on ToDate, then implement RANGE selection mode and after ToDate selected,   ToDate is anchored and user allowed to continue selection of FromDate <br>- If both dates populated then accept either ToDate or FromDate based on datefield selection',
            style: 'margin: 20px 0; font-size: 18px;'
        },
        {
            xtype: 'form',
            bodyPadding: 10,
            items: [
                {
                    xtype: 'fieldset',
                    minHeight: 100,
                    title: '',
                    items: [
                        {
                            xtype: 'container',
                            height: '40px',
                            defaults: {
                                labelStyle: 'text-align: right; font-weight: bold; padding-top: 5px;',
                                height: 35,
                                style: 'padding-top: 5px'
                            },
                            layout: {
                                type: 'hbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    xtype: 'datefield',
                                    useCalendarMatrix: true,
                                    listeners: {
                                        trigcalmatrix: 'onFromDtMixin'
                                    },
                                    dateFieldMixinConfig: {
                                        fromRef: 'fromDt1',
                                        windowFromTitle: 'Select Trade Date:',
                                        disableFn: function(cellDate, matrixCont){  // Disable after today
                                       var today= Ext.Date.clearTime(new Date(Date(Ext.Date.now())), true);
                                       return (cellDate > today);
                                    },
                                        startMonthIdx: -2,
                                        numRows: 1,
                                        numCols: 3
                                    },
                                    reference: 'fromDt1',
                                    itemId: 'fromDt1',
                                    width: 280,
                                    fieldLabel: 'TRADE DATE',
                                    labelWidth: 160
                                },
                                {
                                    xtype: 'button',
                                    listeners: {
                                        click: 'onResetBtnMixinClick'
                                    },
                                    dateFieldMixinConfig: {
                                        fromRef: 'fromDt1'
                                    },
                                    height: 30,
                                    ui: 'plain',
                                    width: 50,
                                    iconCls: 'fa-icon-remove'
                                },
                                {
                                    xtype: 'container',
                                    flex: 1
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            height: '40px',
                            defaults: {
                                labelStyle: 'text-align: right; font-weight: bold; padding-top: 5px;',
                                height: 35,
                                style: 'padding-top: 5px'
                            },
                            layout: {
                                type: 'hbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    xtype: 'datefield',
                                    useCalendarMatrix: true,
                                    listeners: {
                                        trigcalmatrix: 'onFromDtMixin',
                                        focus: 'onDatefieldFocusMixin'
                                    },
                                    dateFieldMixinConfig: {
                                        fromRef: 'fromDt2',
                                        toRef: 'toDt2'
                                    },
                                    reference: 'fromDt2',
                                    itemId: 'fromDt2',
                                    width: 280,
                                    fieldLabel: 'REPORT DATES &nbsp;&nbsp;From',
                                    labelWidth: 160
                                },
                                {
                                    xtype: 'datefield',
                                    useCalendarMatrix: true,
                                    listeners: {
                                        trigcalmatrix: 'onToDtMixin',
                                        focus: 'onDatefieldFocusMixin'
                                    },
                                    dateFieldMixinConfig: {
                                        fromRef: 'fromDt2',
                                        toRef: 'toDt2'
                                    },
                                    reference: 'toDt2',
                                    itemId: 'toDt2',
                                    width: 180,
                                    fieldLabel: 'To',
                                    labelWidth: 60
                                },
                                {
                                    xtype: 'button',
                                    listeners: {
                                        click: 'onResetBtnMixinClick'
                                    },
                                    dateFieldMixinConfig: {
                                        fromRef: 'fromDt2',
                                        toRef: 'toDt2'
                                    },
                                    height: 30,
                                    ui: 'plain',
                                    width: 50,
                                    iconCls: 'fa-icon-remove'
                                },
                                {
                                    xtype: 'container',
                                    flex: 1
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            xtype: 'container',
            flex: 1,
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items: [
                {
                    xtype: 'gridpanel',
                    flex: 1,
                    title: 'Range Edit (Row Editor)',
                    bind: {
                        store: '{myModels}'
                    },
                    columns: [
                        {
                            xtype: 'gridcolumn',
                            dataIndex: 'textfield',
                            text: 'Textfield'
                        },
                        {
                            xtype: 'datecolumn',
                            width: 120,
                            dataIndex: 'fromdate',
                            text: 'Begin Date',
                            format: 'm/j/Y',
                            editor: {
                                xtype: 'datefield',
                                useCalendarMatrix: true,
                                listeners: {
                                    trigcalmatrix: 'onFromDtMixin',
                                    focus: 'onDatefieldFocusMixin'
                                },
                                dateFieldMixinConfig: {
                                    fromRef: 'fromDt3',
                                    toRef: 'toDt3',
                                    windowFromTitle: 'Select Begin Date:'
                                },
                                reference: 'fromDt3'
                            }
                        },
                        {
                            xtype: 'datecolumn',
                            width: 120,
                            dataIndex: 'todate',
                            text: 'End Date',
                            format: 'm/j/Y',
                            editor: {
                                xtype: 'datefield',
                                useCalendarMatrix: true,
                                listeners: {
                                    trigcalmatrix: 'onToDtMixin',
                                    focus: 'onDatefieldFocusMixin'
                                },
                                dateFieldMixinConfig: {
                                    fromRef: 'fromDt3',
                                    toRef: 'toDt3',
                                    windowToTitle: 'Select End Date:'
                                },
                                reference: 'toDt3'
                            }
                        },
                        {
                            xtype: 'numbercolumn',
                            dataIndex: 'numberfield',
                            text: 'Numberfield',
                            format: '00'
                        }
                    ],
                    plugins: [
                        {
                            ptype: 'rowediting',
                            clicksToEdit: 1
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    flex: 1,
                    cls: 'grid-cell-editor-example',
                    title: 'Range Edit (Cell Editor)',
                    bind: {
                        store: '{myModels}'
                    },
                    columns: [
                        {
                            xtype: 'gridcolumn',
                            dataIndex: 'textfield',
                            text: 'Textfield',
                            editor: {
                                xtype: 'textfield'
                            }
                        },
                        {
                            xtype: 'datecolumn',
                            reference: 'fromDt4',
                            itemId: 'fromDt4',
                            width: 120,
                            dataIndex: 'fromdate',
                            text: 'Begin Date',
                            format: 'm/j/Y',
                            editor: {
                                xtype: 'datefield',
                                useCalendarMatrix: true,
                                listeners: {
                                    trigcalmatrix: 'onFromDtMixin',
                                    focus: 'onDatefieldFocusMixin'
                                },
                                dateFieldMixinConfig: {
                                    fromRef: 'fromDt4',
                                    toRef: 'toDt4',
                                    windowFromTitle: 'Select Begin Date:',
                                    cellEditMode: true
                                },
                                reference: 'fromDt4edit'
                            }
                        },
                        {
                            xtype: 'datecolumn',
                            reference: 'toDt4',
                            itemId: 'toDt4',
                            width: 120,
                            dataIndex: 'todate',
                            text: 'End Date',
                            format: 'm/j/Y',
                            editor: {
                                xtype: 'datefield',
                                useCalendarMatrix: true,
                                listeners: {
                                    trigcalmatrix: 'onToDtMixin',
                                    focus: 'onDatefieldFocusMixin'
                                },
                                dateFieldMixinConfig: {
                                    fromRef: 'fromDt4',
                                    toRef: 'toDt4',
                                    windowToTitle: 'Select End Date:',
                                    cellEditMode: true
                                },
                                reference: 'toDt4edit'
                            }
                        },
                        {
                            xtype: 'numbercolumn',
                            dataIndex: 'numberfield',
                            text: 'Numberfield',
                            format: '00',
                            editor: {
                                xtype: 'numberfield'
                            }
                        }
                    ],
                    plugins: [
                        {
                            ptype: 'cellediting',
                            clicksToEdit: 1
                        }
                    ]
                }
            ]
        }
    ],

    initComponent: function() {
        var me = this;

        me.callParent(arguments);

        var ctrl =  me.getController();

        // For cell editing need to add controller scope to listeners after view initialized

        me.down('#fromDt4').editor.listeners.scope = ctrl;
        me.down('#toDt4').editor.listeners.scope = ctrl;



    }

});