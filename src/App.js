import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';
import LZString from 'lz-string';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Utility Data ---
const therapistGroups = [
  {
    role: "WBSP",
    therapists: [
      "Soon Jiaying", "Kirsty Png", "Andrew Lim",
      "Janice Leong", "Oliver Tan", "Claudia Ahl",
      "Seanna Neo", "Xiao Hui"
    ]
  },
  {
    role: "Care Manager",
    therapists: [
      "Tika Zainal", "Dominic Yeo"
    ]
  }
];

const therapists = therapistGroups.flatMap(group => group.therapists);

const therapistColors = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#A833FF',
  '#33FFF2', '#FFC733', '#33A8FF', '#FF8C33', '#8C33FF'
];

const getTherapistColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % therapistColors.length);
  return therapistColors[index];
};

const blockedDays2025 = [
  "2025-01-01", "2025-01-29", "2025-01-30",
  "2025-03-31", "2025-04-18", "2025-05-01",
  "2025-05-12", "2025-06-07", "2025-08-09",
  "2025-03-28", "2025-10-25", "2025-10-20",
  "2025-10-21", "2025-12-25"
];

const blockedDays2026 = [
  "2026-01-01", "2026-02-17", "2026-02-18",
  "2026-03-21", "2026-04-03", "2026-05-01",
  "2026-05-27", "2026-05-31", "2026-06-01",
  "2026-08-09", "2026-08-10", "2026-11-08",
  "2026-11-09", "2026-12-25"
];

const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const getCalendarForYear = (year) => {
  const calendar = [];
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const monthDays = Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const date = new Date(year, monthIndex, dayIndex + 1);
      const formattedMonth = String(monthIndex + 1).padStart(2, '0');
      const formattedDay = String(dayIndex + 1).padStart(2, '0');
      const dayKey = `${year}-${formattedMonth}-${formattedDay}`;
      return { date, dayKey, therapists: [] };
    });
    calendar.push(monthDays);
  }
  return calendar;
};

const patchNotes = [
  {
    version: "1.2",
    date: "July 10, 2025",
    changes: [
      "Enhanced Therapist Section Design: Overhauled the left sidebar for a cleaner, more minimalistic aesthetic.",
      "Collapsible Therapist Roles: Therapists are now grouped by job role (WBSP, Case Manager) into collapsible sections, improving organisation and navigation.",
      "Sleeker Collapsible Indicators: Replaced previous arrow indicators with clear '+' and '-' symbols for a more modern and intuitive expand/collapse experience.",
      "Improved Therapist Tracker Visuals: The 'Therapist Assignment Tracker' now features visual color-coded indicators, displays the monthly average workload, and includes WFH day summaries for better insights.",
      "Refined Card Alignment and Spacing: General spacing and alignment across therapist cards and sections have been fine-tuned for a polished look."
    ]
  },
  {
    version: "1.1",
    date: "July 8, 2025",
    changes: [
      "Added 'Share Link' functionality to save and load calendar state via URL.",
      "Implemented LZString compression for significantly shorter shareable URLs.",
      "Included timestamp in shared data for unique link generation.",
      "Introduced a 'Patch Notes' tab to view application updates.",
      "Added shrinking feature for weekends when saving roster as PNG image."
    ]
  },
  {
    version: "1.0",
    date: "Feb 1, 2025",
    changes: [
      "Initial release of SWEE Therapist Roster application.",
      "Drag-and-drop therapist assignment to calendar days.",
      "Support for 2025 and 2026 calendar years with pre-defined blocked holidays.",
      "Automatic detection and styling for weekends and blocked holidays.",
      "Configurable Working From Home (WFH) settings for each therapist.",
      "Intelligent 'Auto Roster' feature for balanced therapist assignments.",
      "Real-time therapist assignment tracker.",
      "Ability to save the current calendar view as a PNG image."
    ]
  }
];

// --- Styles ---
const sectionHeadingStyle = {
  marginTop: 0,
  marginBottom: '15px',
  color: '#2D3748',
  fontSize: '1.2rem',
  fontWeight: '600',
  paddingBottom: '10px',
  borderBottom: '1px solid #E2E8F0'
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  padding: '15px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  marginBottom: '20px',
};

const tabButtonStyle = {
  padding: '12px 20px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1.1rem',
  fontWeight: '600',
  transition: 'color 0.2s, border-bottom 0.2s',
  flexGrow: 1,
  textAlign: 'center',
  outline: 'none',
};

const buttonStyle = {
  padding: '10px 18px',
  background: '#FFFFFF',
  color: '#4A5568',
  border: '1px solid #CBD5E0',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '500',
  transition: 'background-color 0.2s, box-shadow 0.2s',
  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
};

const tableCellStyle = { border: '1px solid #E2E8F0', padding: '8px', textAlign: 'center' };
const tableHeaderStyle = { ...tableCellStyle, backgroundColor: '#F7FAFC', fontWeight: '600', color: '#4A5568' };

// --- Helper Functions for Data Compression/Decompression ---
const compressData = (data) => {
  const serializedCalendar = {};
  for (const year in data.calendarData) {
    serializedCalendar[year] = data.calendarData[year].map(month =>
      month.map(day => ({
        dayKey: day.dayKey,
        therapists: day.therapists
      }))
    );
  }
  const payload = JSON.stringify({
    timestamp: Date.now(),
    calendar: serializedCalendar,
    wfh: data.workingFromHome
  });
  return LZString.compressToEncodedURIComponent(payload);
};

const decompressData = (compressedString) => {
  try {
    const decompressedPayload = LZString.decompressFromEncodedURIComponent(compressedString);
    if (!decompressedPayload) {
      console.error("Decompression resulted in null. Data might be corrupted or empty.");
      return null;
    }
    const parsed = JSON.parse(decompressedPayload);

    const deserializedCalendar = {};
    for (const year in parsed.calendar) {
      deserializedCalendar[year] = parsed.calendar[year].map(month =>
        month.map(day => {
          const [yearStr, monthStr, dayStr] = day.dayKey.split('-');
          const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
          return {
            date: dateObj,
            dayKey: day.dayKey,
            therapists: day.therapists || []
          };
        })
      );
    }
    return {
      calendarData: deserializedCalendar,
      workingFromHome: parsed.wfh || {},
      timestamp: parsed.timestamp
    };
  } catch (e) {
    console.error("Failed to decompress data:", e);
    return null;
  }
};

// --- Components ---

const Therapist = React.memo(({ name }) => {
  const [, drag] = useDrag(() => ({
    type: 'THERAPIST',
    item: { name },
  }));

  const initials = name.split(' ').map((word) => word[0]).join('').toUpperCase();
  const color = getTherapistColor(name);

  return (
    <div
      ref={drag}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        gap: '10px', padding: '8px 10px', margin: '0', width: '196px',
        boxSizing: 'border-box', backgroundColor: 'transparent',
        borderRadius: '8px', fontWeight: '500', color: '#4A5568',
        border: '1px solid transparent', boxShadow: 'none', cursor: 'grab',
        transition: 'background 0.2s, transform 0.1s, border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#F0F4F8';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#CBD5E0';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          backgroundColor: color, color: 'white', borderRadius: '50%',
          width: '32px', height: '32px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <span>{name}</span>
    </div>
  );
});

const CalendarDay = React.memo(({ day, moveTherapist, removeTherapist, isToday, isBlocked }) => {
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
  const finalBlockedStatus = isBlocked || isWeekend;

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'THERAPIST',
    drop: (item) => {
      if (!finalBlockedStatus) {
        moveTherapist(item.name, day.dayKey);
      }
    },
    canDrop: () => !finalBlockedStatus,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const dayNumber = day.date.getDate();

  let backgroundColor = '#FFFFFF';
  let dayNumberColor = '#4A5568';
  let borderColor = '#E2E8F0';
  let boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)';

  if (finalBlockedStatus) {
    backgroundColor = '#F7FAFC';
    dayNumberColor = '#A0AEC0';
  }
  if (isToday) {
    backgroundColor = '#E6FFFA';
    dayNumberColor = '#2C7A7B';
    borderColor = '#4FD1C5';
  }

  if (isOver && canDrop) {
    backgroundColor = '#B2F5EA';
    borderColor = '#3182CE';
    boxShadow = '0 0 0 3px rgba(49, 130, 206, 0.4)';
  }

  return (
    <div
      ref={drop}
      style={{
        padding: '12px', minHeight: '160px', position: 'relative',
        backgroundColor: backgroundColor, borderRadius: '6px',
        boxShadow: boxShadow, display: 'flex', flexDirection: 'column',
        gap: '10px', border: `1px solid ${borderColor}`,
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      }}
    >
      <strong
        style={{
          alignSelf: 'flex-end', fontSize: '0.9rem', color: dayNumberColor,
          backgroundColor: isToday ? '#B2F5EA' : 'transparent',
          borderRadius: isToday ? '50%' : '0', padding: isToday ? '3px 8px' : '0',
          lineHeight: '1',
        }}
      >
        {dayNumber}
      </strong>

      {day.therapists.length > 0 ? (
        day.therapists.map((therapist, idx) => {
          const initials = therapist.split(' ').map((word) => word[0]).join('').toUpperCase();
          const therapistBlockColor = getTherapistColor(therapist);

          return (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px', backgroundColor: '#E6FFFA', color: '#234E52',
                borderRadius: '8px', justifyContent: 'space-between',
                fontWeight: '600', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  backgroundColor: therapistBlockColor, color: 'white',
                  borderRadius: '50%', width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span style={{ fontSize: '1.05rem', flexGrow: 1 }}>{therapist}</span>
              <button
                onClick={() => removeTherapist(therapist, day.dayKey)}
                style={{
                  marginLeft: '10px', color: '#E53E3E', cursor: 'pointer',
                  background: 'transparent', border: 'none', fontWeight: 'bold',
                  padding: '2px', lineHeight: '1', fontSize: '1.2rem', transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#C53030')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#E53E3E')}
                title={`Remove ${therapist}`}
              >
                ×
              </button>
            </div>
          );
        })
      ) : (
        !finalBlockedStatus && (
          <div style={{
            fontSize: '0.85rem', color: '#A0AEC0', textAlign: 'center',
            marginTop: 'auto', marginBottom: 'auto'
          }}>
            Empty
          </div>
        )
      )}
      {finalBlockedStatus && !isToday && (
        <div style={{
          fontSize: '0.8rem', color: '#718096', textAlign: 'center',
          marginTop: 'auto', marginBottom: 'auto'
        }}>
          {isWeekend && !isBlocked ? 'Weekend' : 'Blocked'}
        </div>
      )}
    </div>
  );
});

const Calendar = React.memo(({ monthDays, moveTherapist, removeTherapist, todayDate, blockedDaysForYear }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = monthDays.length > 0 ? monthDays[0].date.getDay() : 0;

  return (
    <>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px',
        marginTop: '20px', marginBottom: '8px', fontWeight: '600',
        color: '#4A5568', textAlign: 'center',
      }}>
        {daysOfWeek.map(dayName => <div key={dayName}>{dayName}</div>)}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px',
      }}>
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} style={{
            backgroundColor: '#F7FAFC', borderRadius: '6px', minHeight: '160px',
          }} />
        ))}
        {monthDays.map((day) => {
          const isToday = todayDate && day.date.toDateString() === todayDate.toDateString();
          const isBlocked = blockedDaysForYear.includes(day.dayKey);
          return (
            <CalendarDay
              key={day.dayKey}
              day={day}
              moveTherapist={moveTherapist}
              removeTherapist={removeTherapist}
              isToday={isToday}
              isBlocked={isBlocked}
            />
          );
        })}
      </div>
    </>
  );
});

const TherapistList = React.memo(({ therapistGroups, collapsedRoles, toggleCollapse }) => {
  return (
    <div style={cardStyle}>
      <h2 style={sectionHeadingStyle}>Therapists</h2>
      <div style={{ paddingTop: '10px' }}>
        {therapistGroups.map((group) => (
          <div key={group.role} style={{ marginBottom: '8px' }}>
            <button
              onClick={() => toggleCollapse(group.role)}
              style={{
                background: 'transparent', border: 'none', padding: '6px 0',
                fontSize: '1.1rem', fontWeight: '600', color: '#4A5568',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                width: '100%', textAlign: 'left', outline: 'none',
                transition: 'color 0.2s ease, background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F7FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{
                marginRight: '8px', color: '#718096', fontSize: '1.1em',
                fontWeight: 'bold', lineHeight: '1', width: '1em',
                display: 'inline-block', textAlign: 'center',
              }}>
                {collapsedRoles[group.role] ? '+' : '-'}
              </span>
              {group.role}
            </button>
            {!collapsedRoles[group.role] && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px',
                marginTop: '8px', paddingLeft: '20px',
              }}>
                {group.therapists.map((name) => (
                  <Therapist key={name} name={name} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const WFHTable = React.memo(({ therapists, workingFromHome, setWorkingFromHome }) => {
  return (
    <div style={cardStyle}>
      <h3 style={sectionHeadingStyle}>Set Working from Home Days</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Therapist</th>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
              <th key={day} style={tableHeaderStyle}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {therapists.map((therapist) => (
            <tr key={therapist}>
              <td style={{ ...tableCellStyle, textAlign: 'left', fontWeight: '500' }}>{therapist}</td>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                <td key={day} style={tableCellStyle}>
                  <input
                    type="checkbox"
                    style={{ cursor: 'pointer' }}
                    checked={workingFromHome[therapist]?.[day] || false}
                    onChange={() =>
                      setWorkingFromHome((prev) => ({
                        ...prev,
                        [therapist]: {
                          ...prev[therapist],
                          [day]: !prev[therapist]?.[day],
                        },
                      }))
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const AssignmentTracker = React.memo(({ therapists, assignmentCounts, averageShiftsPerTherapist, workingFromHome }) => {
  const getColorForAssignmentCount = useCallback((count) => {
    if (averageShiftsPerTherapist === 0 || therapists.length === 0) return '#A0AEC0';
    const avg = parseFloat(averageShiftsPerTherapist);
    if (count < avg * 0.75) return '#68D391';
    if (count > avg * 1.25) return '#FC8181';
    if (count > avg) return '#F6AD55';
    return '#4FD1C5';
  }, [averageShiftsPerTherapist, therapists.length]);

  const sortedTherapists = useMemo(() => {
    return [...therapists].sort((a, b) => {
      const countA = assignmentCounts[a];
      const countB = assignmentCounts[b];
      if (countA !== countB) {
        return countA - countB;
      }
      return a.localeCompare(b);
    });
  }, [therapists, assignmentCounts]);

  return (
    <div style={cardStyle}>
      <h3 style={sectionHeadingStyle}>Therapist Assignment Tracker</h3>
      <div style={{
        fontSize: '0.9rem', color: '#718096', marginBottom: '15px', textAlign: 'center'
      }}>
        Monthly Average: <strong>{averageShiftsPerTherapist}</strong> shifts per therapist
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px',
      }}>
        {sortedTherapists.map((therapist) => {
          const count = assignmentCounts[therapist];
          const assignmentColor = getColorForAssignmentCount(count);
          const therapistWfhDays = Object.entries(workingFromHome[therapist] || {})
            .filter(([, isWfh]) => isWfh)
            .map(([day]) => day.substring(0, 3));
          return (
            <div
              key={therapist}
              style={{
                padding: '12px', backgroundColor: '#F7FAFC', color: '#234E52',
                borderRadius: '6px', fontSize: '0.9rem',
                border: `1px solid ${assignmentColor}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: '6px', position: 'relative'
              }}
            >
              <strong style={{ display: 'block' }}>{therapist}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Assigned: {count}</span>
                <span style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  backgroundColor: assignmentColor, display: 'inline-block', flexShrink: 0,
                }} title={`Assignment Status: ${count} shifts`}></span>
              </div>
              {therapistWfhDays.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                  WFH: {therapistWfhDays.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

const CalendarControls = React.memo(({ currentYear, currentMonth, liveDateTime, setCurrentYear, changeMonth }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
      <h2 style={{ color: '#1A202C', margin: 0, fontSize: '1.5rem' }}>
        {new Date(currentYear, currentMonth, 1).toLocaleString("default", { month: "long" })} {currentYear}
        <span className="generated-text" style={{ fontSize: '0.8em', color: '#666', marginLeft: '15px' }}>
          (Generated: {liveDateTime})
        </span>
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={currentYear}
          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
          style={{
            padding: '10px 14px', border: '1px solid #CBD5E0', borderRadius: '6px',
            backgroundColor: '#FFFFFF', fontSize: '1rem', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
        <button
          type="button"
          style={{ ...buttonStyle, marginRight: '10px' }}
          onClick={() => changeMonth('prev')}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
        >
          ← Previous
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => changeMonth('next')}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
        >
          Next →
        </button>
      </div>
    </div>
  );
});

const ActionButtons = React.memo(({ goToToday, autoRoster, resetCalendar, saveAsPNG, generateShareLink }) => {
  return (
    <div style={{ marginTop: '30px', display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
      <button type="button" style={buttonStyle} onClick={goToToday} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>Today</button>
      <button
        type="button"
        style={{ ...buttonStyle, backgroundColor: '#38A169', color: 'white', border: '1px solid #38A169' }}
        onClick={autoRoster}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2F855A'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#38A169'; }}
      >
        Auto Roster
      </button>
      <button type="button" style={buttonStyle} onClick={resetCalendar} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>Reset Calendar</button>
      <button type="button" style={buttonStyle} onClick={saveAsPNG} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>Save as PNG</button>
      <button
        type="button"
        style={{ ...buttonStyle, backgroundColor: '#3182CE', color: 'white', border: '1px solid #3182CE' }}
        onClick={generateShareLink}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2B6CB0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3182CE'; }}
      >
        Share Link
      </button>
    </div>
  );
});

const PatchNotesSection = React.memo(({ patchNotes }) => {
  return (
    <div style={{ padding: '0px 10px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1A202C', fontSize: '1.5rem' }}>Application Patch Notes</h2>
      {patchNotes.map((patch, index) => (
        <div key={index} style={{ marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px dashed #E2E8F0' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#2D3748', fontSize: '1.2rem' }}>
            Version {patch.version} <span style={{ fontSize: '0.85em', color: '#718096', fontWeight: 'normal' }}>({patch.date})</span>
          </h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '25px', margin: 0 }}>
            {patch.changes.map((change, i) => (
              <li key={i} style={{ marginBottom: '5px', color: '#4A5568', lineHeight: '1.4' }}>{change}</li>
            ))}
          </ul>
        </div>
      ))}
      <p style={{ fontSize: '0.9rem', color: '#718096', textAlign: 'center', marginTop: '30px' }}>End of Patch Notes.</p>
    </div>
  );
});

// --- Main App Component ---
const App = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [activeTab, setActiveTab] = useState('calendar');
  const [liveDateTime, setLiveDateTime] = useState('');

  const initialCollapsedRolesState = useMemo(() => (
    therapistGroups.reduce((acc, group) => {
      acc[group.role] = false;
      return acc;
    }, {})
  ), []);
  const [collapsedRoles, setCollapsedRoles] = useState(initialCollapsedRolesState);

  const [calendarData, setCalendarData] = useState(() => ({
    2025: getCalendarForYear(2025),
    2026: getCalendarForYear(2026),
  }));

  const [todayDate, setTodayDate] = useState(null);
  const [autoRosterTriggered, setAutoRosterTriggered] = useState(false);

  const [workingFromHome, setWorkingFromHome] = useState(
    {
      "Dominic Yeo": { Monday: false, Tuesday: true, Wednesday: true, Thursday: true, Friday: false },
      "Kirsty Png": { Monday: false, Tuesday: false, Wednesday: true, Thursday: false, Friday: false },
      "Soon Jiaying": { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true },
      "Andrew Lim": { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true },
      "Janice Leong": { Monday: false, Tuesday: true, Wednesday: true, Thursday: false, Friday: false },
      "Oliver Tan": { Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: false },
      "Claudia Ahl": { Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false },
      "Seanna Neo": { Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: false },
      "Xiao Hui": { Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false },
      "Tika Zainal": { Monday: false, Tuesday: true, Wednesday: true, Thursday: true, Friday: false },
    }
  );

  const currentBlockedDays = useMemo(() => (
    currentYear === 2025 ? blockedDays2025 : blockedDays2026
  ), [currentYear]);

  // --- Start of Tracker Section Calculations (Memoized for performance) ---
  const assignmentCounts = useMemo(() => {
    return therapists.reduce((acc, therapist) => {
      acc[therapist] = calendarData[currentYear]?.[currentMonth]?.filter((day) =>
        day.therapists.includes(therapist)
      ).length || 0;
      return acc;
    }, {});
  }, [calendarData, currentYear, currentMonth]);

  const totalAssignedShiftsOverall = useMemo(() => (
    Object.values(assignmentCounts).reduce((sum, count) => sum + count, 0)
  ), [assignmentCounts]);

  const averageShiftsPerTherapist = useMemo(() => (
    therapists.length > 0
      ? (totalAssignedShiftsOverall / therapists.length).toFixed(1)
      : 0
  ), [totalAssignedShiftsOverall, therapists.length]);
  // --- End of Tracker Section Calculations ---

  const actualCurrentDate = useMemo(() => new Date(), []);
  const actualCurrentDay = useMemo(() => actualCurrentDate.getDate(), [actualCurrentDate]);
  const actualCurrentMonthIndex = useMemo(() => actualCurrentDate.getMonth(), [actualCurrentDate]);
  const actualCurrentYear = useMemo(() => actualCurrentDate.getFullYear(), [actualCurrentDate]);

  // Effect hook to manage 'today' highlight and month display when the year changes
  useEffect(() => {
    setTodayDate(null);
    if (currentYear === actualCurrentYear) {
      setCurrentMonth(actualCurrentMonthIndex);
      setTodayDate(new Date(actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay));
    } else {
      setCurrentMonth(0);
    }
  }, [currentYear, actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay]);

  // Effect hook to update live date and time every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setLiveDateTime(now.toLocaleString('en-SG', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }));
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Effect hook to parse URL for shared data on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('data');

    if (sharedData) {
      const decompressed = decompressData(sharedData);

      if (decompressed) {
        setCalendarData(decompressed.calendarData);
        setWorkingFromHome(decompressed.workingFromHome);
        console.log(`Calendar and WFH data loaded from shared link (Timestamp: ${decompressed.timestamp || 'N/A'})!`);
        toast.info("Calendar data loaded from shared link!", { position: "top-center", autoClose: 3000 });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const goToToday = useCallback(() => {
    if (currentYear === actualCurrentYear) {
      setCurrentMonth(actualCurrentMonthIndex);
      setTodayDate(new Date(actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay));
      toast.info("Navigated to today's date!", { position: "top-right", autoClose: 2000 });
    } else {
      toast.warn("Cannot go to 'Today' in a different year. Please switch to the current year first.", { position: "top-center", autoClose: 4000 });
    }
  }, [currentYear, actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay]);

  const moveTherapist = useCallback((name, dayKey) => {
    setCalendarData((prevCalendarData) => {
      const updatedCalendarData = { ...prevCalendarData };
      const yearCalendar = [...updatedCalendarData[currentYear]];
      const updatedMonth = yearCalendar[currentMonth].map((day) => {
        if (day.dayKey === dayKey && !currentBlockedDays.includes(dayKey) && !day.therapists.includes(name)) {
          const dateParts = day.dayKey.split('-');
          const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

          if (!isWeekend) {
            return { ...day, therapists: [...day.therapists, name] };
          }
        }
        return day;
      });

      yearCalendar[currentMonth] = updatedMonth;
      updatedCalendarData[currentYear] = yearCalendar;
      return updatedCalendarData;
    });
  }, [currentYear, currentMonth, currentBlockedDays]);

  const removeTherapist = useCallback((name, dayKey) => {
    setCalendarData((prevCalendarData) => {
      const updatedCalendarData = { ...prevCalendarData };
      const yearCalendar = [...updatedCalendarData[currentYear]];
      const updatedMonth = yearCalendar[currentMonth].map((day) => {
        if (day.dayKey === dayKey) {
          return { ...day, therapists: day.therapists.filter((t) => t !== name) };
        }
        return day;
      });

      yearCalendar[currentMonth] = updatedMonth;
      updatedCalendarData[currentYear] = yearCalendar;
      return updatedCalendarData;
    });
  }, [currentYear, currentMonth]);

  const resetCalendar = useCallback(() => {
    setCalendarData((prevCalendarData) => ({
      ...prevCalendarData,
      2025: getCalendarForYear(2025),
      2026: getCalendarForYear(2026),
    }));
    setWorkingFromHome({
      "Dominic Yeo": { Monday: false, Tuesday: true, Wednesday: true, Thursday: true, Friday: false },
      "Kirsty Png": { Monday: false, Tuesday: false, Wednesday: true, Thursday: false, Friday: false },
      "Soon Jiaying": { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true },
      "Andrew Lim": { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true },
      "Janice Leong": { Monday: false, Tuesday: true, Wednesday: true, Thursday: false, Friday: false },
      "Oliver Tan": { Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: false },
      "Claudia Ahl": { Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false },
      "Seanna Neo": { Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: false },
      "Xiao Hui": { Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false },
      "Tika Zainal": { Monday: false, Tuesday: true, Wednesday: true, Thursday: true, Friday: false },
    });
    setAutoRosterTriggered(false);
    toast.info("Calendar settings have been reset!", { position: "top-right", autoClose: 2000 });
  }, []);

  const saveAsPNG = useCallback(() => {
    const calendarContainer = document.getElementById("calendar-container-content");
    if (!calendarContainer) {
      console.error("Calendar container content not found for PNG export.");
      toast.error("Failed to capture calendar. Please try again.", { position: "bottom-center", autoClose: 3000 });
      return;
    }

    toast.info("Generating PNG image...", { position: "bottom-center", autoClose: 1500 }); // Provide immediate feedback

    const style = document.createElement('style');
    style.id = 'png-export-styles';
    style.innerHTML = `
      #calendar-container-content {
        padding-right: 150px !important;
        padding-top: 50px !important;
      }
      #calendar-container-content h2 .generated-text {
        font-size: 0.7em !important;
      }
    `;
    document.head.appendChild(style);

    html2canvas(calendarContainer, {
      backgroundColor: "#FFFFFF",
      useCORS: true,
      scale: 2
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const currentMonthName = calendarData[currentYear]?.[currentMonth]?.[0]?.date.toLocaleString("default", { month: "long" });
      link.href = imgData;
      link.download = `Therapist_Roster_${currentMonthName}_${currentYear}.png`;
      link.click();
      toast.success("PNG image saved successfully!", { position: "bottom-center", autoClose: 3000 });
    }).catch((error) => {
      console.error("Error generating PNG:", error);
      toast.error("Error saving PNG image. Please try again.", { position: "bottom-center", autoClose: 3000 });
    }).finally(() => {
      const tempStyle = document.getElementById('png-export-styles');
      if (tempStyle) {
        tempStyle.remove();
      }
    });
  }, [calendarData, currentYear, currentMonth]);

  const generateShareLink = useCallback(() => {
    const dataToShare = {
      calendarData: calendarData,
      workingFromHome: workingFromHome
    };
    const compressedEncodedData = compressData(dataToShare);
    const shareableUrl = `${window.location.origin}${window.location.pathname}?data=${compressedEncodedData}`;

    navigator.clipboard.writeText(shareableUrl)
      .then(() => {
        toast.success("Shareable link copied to clipboard!", {
          position: "bottom-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
        toast.error("Failed to copy link to clipboard.", {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      });
  }, [calendarData, workingFromHome]);

  const autoRoster = useCallback(() => {
    setCalendarData((prevCalendarData) => {
      const updatedCalendarData = { ...prevCalendarData };
      const currentYearCalendar = [...updatedCalendarData[currentYear]];
      const currentMonthData = [...currentYearCalendar[currentMonth]];

      const monthlyAssignmentCounts = therapists.reduce((acc, t) => ({ ...acc, [t]: 0 }), {});

      let totalPossibleSlots = 0;
      currentMonthData.forEach(day => {
        const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
        if (!currentBlockedDays.includes(day.dayKey) && !isWeekend) {
          totalPossibleSlots++;
        }
      });
      const targetAverageShifts = Math.max(1, totalPossibleSlots / therapists.length);
      const LAGGING_THRESHOLD = 2;

      let therapistConsiderationOrder = [...therapists].sort(() => Math.random() - 0.5);

      const newMonthDays = currentMonthData.map((day) => {
        const newDay = { ...day, therapists: [...day.therapists] };
        const isWeekend = newDay.date.getDay() === 0 || newDay.date.getDay() === 6;
        const dayOfWeek = newDay.date.toLocaleString('default', { weekday: 'long' });

        if (
          newDay.therapists.length === 0 &&
          !currentBlockedDays.includes(newDay.dayKey) &&
          !isWeekend
        ) {
          let assignedThisDay = false;
          const availableToday = therapistConsiderationOrder.filter(
            (t) => !workingFromHome[t]?.[dayOfWeek]
          );

          if (availableToday.length > 0) {
            availableToday.sort((a, b) => monthlyAssignmentCounts[a] - monthlyAssignmentCounts[b]);
            const currentAssignedValues = Object.values(monthlyAssignmentCounts).filter(c => c > 0);
            const currentAverage = currentAssignedValues.length > 0
              ? currentAssignedValues.reduce((sum, val) => sum + val, 0) / currentAssignedValues.length
              : 0;

            let therapistToAssign = null;
            const laggingAndAvailable = availableToday.filter(
              (t) => monthlyAssignmentCounts[t] < Math.max(1, currentAverage - LAGGING_THRESHOLD / 2) ||
                monthlyAssignmentCounts[t] < Math.max(1, targetAverageShifts - LAGGING_THRESHOLD)
            );

            laggingAndAvailable.sort((a, b) => monthlyAssignmentCounts[a] - monthlyAssignmentCounts[b]);

            if (laggingAndAvailable.length > 0) {
              therapistToAssign = laggingAndAvailable[0];
            } else {
              if (availableToday.length > 0) {
                therapistToAssign = availableToday[0];
              }
            }

            if (therapistToAssign) {
              newDay.therapists = [therapistToAssign];
              monthlyAssignmentCounts[therapistToAssign]++;
              therapistConsiderationOrder = [
                ...therapistConsiderationOrder.filter(t => t !== therapistToAssign),
                therapistToAssign
              ];
              assignedThisDay = true;
            }
          }
        }
        return newDay;
      });

      currentYearCalendar[currentMonth] = newMonthDays;
      updatedCalendarData[currentYear] = currentYearCalendar;
      return updatedCalendarData;
    });
    setAutoRosterTriggered(true);
    toast.success("Auto Roster completed!", { position: "top-right", autoClose: 2000 });
  }, [currentYear, currentMonth, currentBlockedDays, workingFromHome]);

  const changeMonth = useCallback((direction) => {
    setCurrentMonth((prevMonth) => {
      let newMonth = prevMonth;
      if (direction === 'next') {
        newMonth = (prevMonth + 1) % 12;
      } else if (direction === 'prev') {
        newMonth = (prevMonth - 1 + 12) % 12;
      }
      setTodayDate(null);
      return newMonth;
    });
  }, []);

  const toggleCollapse = useCallback((role) => {
    setCollapsedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        padding: '20px', backgroundColor: '#F9FAFB', minHeight: '100vh',
      }}>
        <ToastContainer />

        <div style={{
          display: 'flex', gap: '30px', maxWidth: '1800px', margin: '0 auto',
        }}>

          {/* Left Sidebar */}
          <div style={{
            flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <TherapistList
              therapistGroups={therapistGroups}
              collapsedRoles={collapsedRoles}
              toggleCollapse={toggleCollapse}
            />
            <WFHTable
              therapists={therapists}
              workingFromHome={workingFromHome}
              setWorkingFromHome={setWorkingFromHome}
            />
            <AssignmentTracker
              therapists={therapists}
              assignmentCounts={assignmentCounts}
              averageShiftsPerTherapist={averageShiftsPerTherapist}
              workingFromHome={workingFromHome}
            />
          </div>

          {/* Main Content Area */}
          <div style={{
            flex: '1', backgroundColor: '#FFFFFF', padding: '25px',
            borderRadius: '12px', boxShadow: '0 6px 18px rgba(0,0,0,0.07)',
          }}>
            {/* Tab Navigation Buttons */}
            <div style={{ display: 'flex', marginBottom: '25px', borderBottom: '1px solid #E2E8F0' }}>
              <button
                onClick={() => setActiveTab('calendar')}
                style={{
                  ...tabButtonStyle,
                  borderBottom: activeTab === 'calendar' ? '2px solid #3182CE' : 'none',
                  color: activeTab === 'calendar' ? '#3182CE' : '#4A5568',
                }}
              >
                Calendar
              </button>
              <button
                onClick={() => setActiveTab('patchNotes')}
                style={{
                  ...tabButtonStyle,
                  borderBottom: activeTab === 'patchNotes' ? '2px solid #3182CE' : 'none',
                  color: activeTab === 'patchNotes' ? '#3182CE' : '#4A5568',
                }}
              >
                Patch Notes
              </button>
            </div>

            {/* Conditional Rendering based on activeTab */}
            {activeTab === 'calendar' && (
              <>
                <div id="calendar-container-content">
                  <CalendarControls
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    liveDateTime={liveDateTime}
                    setCurrentYear={setCurrentYear}
                    changeMonth={changeMonth}
                  />
                  <Calendar
                    monthDays={calendarData[currentYear][currentMonth]}
                    moveTherapist={moveTherapist}
                    removeTherapist={removeTherapist}
                    todayDate={todayDate}
                    blockedDaysForYear={currentBlockedDays}
                  />
                </div>
                <ActionButtons
                  goToToday={goToToday}
                  autoRoster={autoRoster}
                  resetCalendar={resetCalendar}
                  saveAsPNG={saveAsPNG}
                  generateShareLink={generateShareLink}
                />
              </>
            )}

            {activeTab === 'patchNotes' && (
              <PatchNotesSection patchNotes={patchNotes} />
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;





























