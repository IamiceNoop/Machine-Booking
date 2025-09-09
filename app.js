const MACHINE_LIMITS = { "Air Sampling":4, "Ionic Sampling":2 };
let bookings = [];
let calendarYear, calendarMonth;
let currentFilters = { machineType:"", shift:"", date:"", department:"", bookingType:"" };

function getMonthYearString(year, month) {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${monthNames[month]} ${year}`;
}

function addBookingRow(defaults={}) {
  const row = document.createElement('div');
  row.className = 'multi-book-row';
  row.style.marginBottom='7px';
  row.innerHTML = `
    <select class="book-machine-type" required>
      <option value="">Type</option>
      <option value="Air Sampling">Air Sampling</option>
      <option value="Ionic Sampling">Ionic Sampling</option>
    </select>
    <select class="book-shift" required>
      <option value="">Shift</option>
      <option value="Day shift">Day shift</option>
      <option value="Night shift">Night shift</option>
    </select>
    <input type="number" min="1" class="book-machine-count" placeholder="Count" style="width:65px;" required>
    <select class="book-booking-type" required>
      <option value="">Booking Type</option>
      <option value="Routine">Routine</option>
      <option value="Special">Special</option>
    </select>
    <button type="button" class="remove-book-row">&#10006;</button>
  `;
  row.querySelector('.remove-book-row').onclick = () => row.remove();
  if(defaults.machineType) row.querySelector('.book-machine-type').value=defaults.machineType;
  if(defaults.shift) row.querySelector('.book-shift').value=defaults.shift;
  if(defaults.machineCount) row.querySelector('.book-machine-count').value=defaults.machineCount;
  if(defaults.bookingType) row.querySelector('.book-booking-type').value=defaults.bookingType;
  document.getElementById('multi-book-list').appendChild(row);
}

document.getElementById('add-book-row').onclick = ()=>addBookingRow();
addBookingRow();

document.getElementById('booking-form').addEventListener('submit', function(e){
  e.preventDefault();
  const name=document.getElementById('name').value.trim();
  const department=document.getElementById('department').value;
  const building=document.getElementById('building').value;
  const date=document.getElementById('date').value;
  const remark=document.getElementById('remark').value.trim();
  const rows=Array.from(document.querySelectorAll('.multi-book-row'));
  const formMessage=document.getElementById('form-message');
  formMessage.textContent=""; formMessage.style.color="#b02d2d";

  let requests=[]; let slotKeyToSum={};

  for(const row of rows){
    const machineType=row.querySelector('.book-machine-type').value;
    const shiftValue=row.querySelector('.book-shift').value;
    const shift=shiftValue==="Day shift"?"Day":shiftValue==="Night shift"?"Night":shiftValue;
    const count=parseInt(row.querySelector('.book-machine-count').value,10);
    const bookingType=row.querySelector('.book-booking-type').value;
    if(!machineType || !shift || !count || count<1 || !bookingType){
      formMessage.textContent="Please fill all booking selections and specify at least 1 machine for each.";
      return;
    }
    requests.push({name, department, building, shift, machineType, date, machineCount:count, remark, bookingType});
    const slotKey=`${date}|${shift}|${machineType}`;
    slotKeyToSum[slotKey]=(slotKeyToSum[slotKey]||0)+count;
  }

  for(const slotKey in slotKeyToSum){
    const [dateStr, shift, machineType]=slotKey.split('|');
    const requested=slotKeyToSum[slotKey];
    const currentBooked=bookings.filter(b=>b.date===dateStr && b.machineType===machineType && b.shift===shift)
                                 .reduce((sum,b)=>sum+(b.machineCount||1),0);
    const left=MACHINE_LIMITS[machineType]-currentBooked;
    if(requested>left){
      formMessage.textContent=`Only ${left} ${machineType} machine(s) available for ${shift} shift on this day.`;
      return;
    }
  }

  for(const req of requests) bookings.push(req);
  renderBookingList(currentFilters);
  renderCalendarTable(calendarYear, calendarMonth);

  formMessage.style.color="green"; formMessage.textContent="Booking successful!";
  setTimeout(()=>{formMessage.textContent=""; formMessage.style.color="#b02d2d";},2000);

  document.getElementById('multi-book-list').innerHTML=''; addBookingRow();
  this.reset();
});

function renderBookingList(filters={}){
  const tbody=document.querySelector("#booking-list-table tbody");
  tbody.innerHTML="";
  let filteredBookings=bookings.filter(b=>{
    if(filters.machineType && b.machineType!==filters.machineType) return false;
    if(filters.shift && b.shift!==filters.shift) return false;
    if(filters.date && b.date!==filters.date) return false;
    if(filters.department && b.department!==filters.department) return false;
    if(filters.bookingType && b.bookingType!==filters.bookingType) return false;
    return true;
  });

  filteredBookings.forEach((booking,index)=>{
    const row=document.createElement("tr");
    row.innerHTML=`
      <td>${booking.name}</td>
      <td>${booking.department}</td>
      <td>${booking.building||""}</td>
      <td>${booking.machineType}</td>
      <td>${booking.shift} shift</td>
      <td>${booking.date}</td>
      <td>${booking.machineCount}</td>
      <td>${booking.bookingType}</td>
      <td>${booking.remark||""}</td>
      <td><button class="remove-booking-btn">Delete</button></td>
    `;
    row.querySelector('.remove-booking-btn').onclick=()=>{bookings.splice(bookings.indexOf(booking),1); renderBookingList(currentFilters); renderCalendarTable(calendarYear, calendarMonth);};
    tbody.appendChild(row);
  });
}

function renderCalendarTable(year, month){
  document.getElementById("calendarMonth").textContent=getMonthYearString(year,month);
  const container=document.getElementById("calendar-table-container");
  const today=new Date();
  const daysInMonth=new Date(year,month+1,0).getDate();

  let html=`<table id="calendar-table"><thead><tr><th></th><th></th>`;
  for(let date=1;date<=daysInMonth;date++){
    const isToday=(date===today.getDate() && month===today.getMonth() && year===today.getFullYear());
    html+=`<th${isToday?' class="calendar-today"':''}>${date}</th>`;
  }
  html+=`</tr></thead><tbody>`;

  ["Day","Night"].forEach(shift=>{
    ["Ionic Sampling","Air Sampling"].forEach(machineType=>{
      html+=`<tr>`;
      if(machineType==="Ionic Sampling") html+=`<td rowspan="2" style="font-weight:bold; background:#e4e4e4">${shift} shift</td>`;
      html+=`<td style="font-weight:600;">${machineType==="Ionic Sampling"?"Ionic":"Air"}</td>`;

      for(let date=1;date<=daysInMonth;date++){
        const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(date).padStart(2,'0')}`;
        const cellBookings=bookings.filter(b=>b.date===dateStr && b.machineType===machineType && b.shift===shift);
        const totalBooked=cellBookings.reduce((sum,b)=>sum+(b.machineCount||1),0);
        const left=MACHINE_LIMITS[machineType]-totalBooked;
        let cellClass=left<=0?"calendar-full":"calendar-available";
        let cellContent=`<div style="font-size:0.75em; margin-bottom:2px;">${left<=0?"Full":left}</div>`;
        cellBookings.forEach(b=>{
          const badgeClass=b.bookingType==="Routine"?"booking-routine-badge":"booking-special-badge";
          cellContent+=`<span class="${badgeClass}" title="Name: ${b.name}\nDept: ${b.department}\nCount: ${b.machineCount}\nType: ${b.bookingType}\nRemark: ${b.remark||''}"></span>`;
        });
        const isTodayCell=(date===today.getDate() && month===today.getMonth() && year===today.getFullYear());
        html+=`<td class="${cellClass}${isTodayCell?' calendar-today':''}">${cellContent}</td>`;
      }

      html+=`</tr>`;
    });
  });

  html+=`</tbody></table>`;
  container.innerHTML=html;
}

function updateFilters(){
  currentFilters.machineType=document.getElementById('filter-machine-type').value;
  currentFilters.shift=document.getElementById('filter-shift').value;
  currentFilters.date=document.getElementById('filter-date').value;
  currentFilters.department=document.getElementById('filter-department').value;
  currentFilters.bookingType=document.getElementById('filter-booking-type').value;
  renderBookingList(currentFilters);
}

document.getElementById('filter-machine-type').addEventListener('change',updateFilters);
document.getElementById('filter-shift').addEventListener('change',updateFilters);
document.getElementById('filter-date').addEventListener('change',updateFilters);
document.getElementById('filter-department').addEventListener('change',updateFilters);
document.getElementById('filter-booking-type').addEventListener('change',updateFilters);

function showPrevMonth(){calendarMonth--; if(calendarMonth<0){calendarMonth=11;calendarYear--;} renderCalendarTable(calendarYear,calendarMonth);}
function showNextMonth(){calendarMonth++; if(calendarMonth>11){calendarMonth=0;calendarYear++;} renderCalendarTable(calendarYear,calendarMonth);}
document.getElementById('prevMonthBtn').addEventListener('click',showPrevMonth);
document.getElementById('nextMonthBtn').addEventListener('click',showNextMonth);

const today=new Date();
calendarYear=today.getFullYear();
calendarMonth=today.getMonth();
renderCalendarTable(calendarYear,calendarMonth);
renderBookingList(currentFilters);
