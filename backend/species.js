// Mirrors the SPECIES table in the frontend so the backend can independently
// decide whether a report is dangerous enough to raise an alert, rather than
// trusting a client-supplied flag.
const SPECIES = {
  tiger:    { name: 'Tiger',    dangerous: true },
  lion:     { name: 'Lion',     dangerous: true },
  leopard:  { name: 'Leopard',  dangerous: true },
  elephant: { name: 'Elephant', dangerous: true },
  other:    { name: 'Other',    dangerous: false },
  unknown:  { name: 'Unknown',  dangerous: false },
};
module.exports = { SPECIES };
