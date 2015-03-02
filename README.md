# CalendarMatrix
EXTJS Enhanced Calendar Component for custom styled Calendar Grids.  Supports Read-Only, Range Select, Multi-Select, and Single Date Select.


CalendarMatrix is an EXTJS 5.x component that extends Ext.picker.Date to provide incredible flexibility in the implementation of Sencha's date picker component.  This component will work with earlier version of EXTJS with slight modifications.  Following examples are included in the demo and within the enclosed CalendarMatrixDemo project (Architect 3.2 project also included):

- MarketWatch style Options Expiration read-only Calendar with Legend
- Multi "random" date selection example
- Single Date selection popup demonstrating numerous advanced features including: International Language support, customized HTML within each date cell, custom weekend styling, customized disabled dates
- TripAdvisor, Trivago, Expedia and Travelocity styled date range selector examples
- Combination example of Single Date selection and Range selection within Forms, Grids (row editing and cell editing).
  Demonstrates custom implementation of CalendarMatrix utilizing Ext.form.field.Date which allows manual date input with validation, but where CalendarMatrix replaces the standard datepicker.
  DateFieldMixin.js is provided which demonstrates how a Mixin class can be used to simplify repetitive implementations of common
  functionality.  

<br><b>CalendarMatrix Demo:</b> http://www.gomainerentals.com/Sencha/CalendarMatrixDemo/index.html

<br>Also see how CalendarMatrix can be used to enhance EXTJS provided Calendar Application by adding "Year" tab with selection features similar to Yahoo calendar:
<br><b>Calendar App Demo:</b> http://www.gomainerentals.com/Sencha/CalendarApp/index.html
<br>- Select date within Year tab to open Day tab
<br>- Select month title with Year tab to open Month tab
<br>- Can also be used to replace the DatePicker selector on left providing week and month highlighting features consistent with Google and Yahoo calendars.

<br>This software can be downloaded at:
<br>https://github.com/swluken/CalendarMatrix
<br>**Don't forget to STAR this repository in GITHUB to be notified for frequent changes !!

<br>The relevant files are found in ./CalendarMatrixDemo/src/ux/CalendarMatrix/ directory:
<br>- DateMatrixPickerExtension.js
<br>- CalendarMatrix.js  (see comments for config documentation; see CalendarMatrixDemo project for how to implement events "calendarselect", "monthselect" and "mouseover" and how to implement custom styling via CSS)
<br>- DateFieldMixin.js  (see comments for detailed usage)

<br>Sencha Forum thread:  http://www.sencha.com/forum/showthread.php?298088-CalendarMatrix-Component&p=1088490#post1088490

<br>The equivalent Sencha Touch "CalendarPicker" component can be found at: 
<br>https://github.com/swluken/TouchTreeGrid
<br><b>CalendarPicker Demo</b><br>http://www.gomainerentals.com/Sencha/CalendarPicker/app.html

<br><br>


License
-------

Copyright (c) 2015 Steve Luken. 
This software is free to use (refer to associated MIT.LISCENSE) .

