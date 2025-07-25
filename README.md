# SWEE Therapist Roster
A responsive, zero-backend scheduling tool built for the Staff Wellbeing and Engagement (SWEE) team to manage therapist rosters. The app supports therapist shift assignments, work-from-home (WFH) toggles, PNG export of schedules, and shareable links via LZ-string compression.

## Features
- Drag-and-drop therapist assignment for AM/PM shifts across a work week
- WFH toggle per therapist, per shift
- PNG export of the weekly schedule using `html-to-image`
- Shareable compressed URLs (using `lz-string`) for lightweight collaboration
- Mobile-first, accessible design using Tailwind CSS
- No backend required — fully static and portable

## Tech Stack
- React (with Vite)
- TypeScript
- Tailwind CSS
- `@dnd-kit/core` or `react-beautiful-dnd` for drag-and-drop
- `lz-string` for URL compression
- `html-to-image` for export
- `classnames`, `date-fns`, and other minimal utilities




