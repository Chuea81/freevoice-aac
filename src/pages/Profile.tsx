import { useState, useEffect } from 'react';
import { useUserProfileStore, type CommunicationLevel } from '../store/userProfileStore';
import { useCharacterStore } from '../store/characterStore';
import { Avatar } from '../components/Avatar/Avatar';
import { CharacterPicker } from '../components/CharacterPicker/CharacterPicker';

const US_STATES: { value: string; label: string }[] = [
  { value: '', label: 'Select state…' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' }, { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' }, { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' }, { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' }, { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' }, { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' }, { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' }, { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand',
  'Ireland', 'India', 'Other',
];

const COMMUNICATION_LEVELS: { value: CommunicationLevel; label: string; hint: string }[] = [
  { value: 'beginner',     label: 'Beginner',     hint: 'Learning core symbols and short phrases' },
  { value: 'intermediate', label: 'Intermediate', hint: 'Combining symbols into sentences' },
  { value: 'advanced',     label: 'Advanced',     hint: 'Building complex multi-part messages' },
];

interface Props {
  onBack: () => void;
}

export function Profile({ onBack }: Props) {
  const profile = useUserProfileStore((s) => s.profile);
  const updateField = useUserProfileStore((s) => s.updateField);
  const saveNow = useUserProfileStore((s) => s.saveNow);
  const lastSavedAt = useUserProfileStore((s) => s.lastSavedAt);

  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const setSelectedCharacter = useCharacterStore((s) => s.setSelectedCharacter);

  const [showPicker, setShowPicker] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (lastSavedAt === 0) return;
    setSavedFlash(true);
    const t = window.setTimeout(() => setSavedFlash(false), 1500);
    return () => window.clearTimeout(t);
  }, [lastSavedAt]);

  const handleClose = () => {
    void saveNow();
    onBack();
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="profile-back-btn" onClick={handleClose} aria-label="Close profile">← Back</button>
        <h1 className="profile-title">My Profile</h1>
        <div className={`profile-saved-flash${savedFlash ? ' on' : ''}`} aria-live="polite">
          {savedFlash ? '✓ Saved' : ''}
        </div>
      </div>

      <div className="profile-scroll">

        {/* ── Avatar ── */}
        <section className="profile-section profile-avatar-section">
          <div className="profile-avatar-frame">
            {selectedCharacterId ? (
              <Avatar characterId={selectedCharacterId} size={120} aria-label="Your avatar" />
            ) : (
              <div className="profile-avatar-empty" aria-hidden="true">👋</div>
            )}
          </div>
          <button
            type="button"
            className="profile-avatar-change-btn"
            onClick={() => setShowPicker((v) => !v)}
            aria-expanded={showPicker}
          >
            {showPicker ? 'Done' : 'Change Avatar'}
          </button>
          {showPicker && (
            <div className="profile-avatar-picker">
              <CharacterPicker
                onSelect={(id) => {
                  setSelectedCharacter(id === 'none' ? null : id);
                  setShowPicker(false);
                }}
                showSkipOption={true}
              />
            </div>
          )}
        </section>

        {/* ── Identity ── */}
        <section className="profile-section">
          <h2 className="profile-section-title">About You</h2>
          <div className="profile-row-pair">
            <Field label="First Name">
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                autoComplete="given-name"
                placeholder="First name"
              />
            </Field>
            <Field label="Last Name">
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                autoComplete="family-name"
                placeholder="Last name"
              />
            </Field>
          </div>
          <Field label="Preferred Name / Nickname" hint="The app will use this to greet you">
            <input
              type="text"
              value={profile.preferredName}
              onChange={(e) => updateField('preferredName', e.target.value)}
              autoComplete="nickname"
              placeholder="What should we call you?"
            />
          </Field>
          <Field label="Date of Birth">
            <input
              type="date"
              value={profile.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>
        </section>

        {/* ── Location ── */}
        <section className="profile-section">
          <h2 className="profile-section-title">Where You Live</h2>
          <Field label="City">
            <input
              type="text"
              value={profile.city}
              onChange={(e) => updateField('city', e.target.value)}
              autoComplete="address-level2"
              placeholder="City"
            />
          </Field>
          <div className="profile-row-pair">
            <Field label="State">
              <select
                value={profile.state}
                onChange={(e) => updateField('state', e.target.value)}
              >
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Country">
              <select
                value={profile.country}
                onChange={(e) => updateField('country', e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* ── About Me ── */}
        <section className="profile-section">
          <h2 className="profile-section-title">About Me</h2>
          <Field label="Notes" hint="Likes, allergies, preferences — anything that helps us know you better">
            <textarea
              rows={4}
              value={profile.aboutMe}
              onChange={(e) => updateField('aboutMe', e.target.value)}
              placeholder="Loves dinosaurs, favorite color is blue, allergic to peanuts…"
            />
          </Field>
        </section>

        {/* ── Caregiver ── */}
        <section className="profile-section">
          <h2 className="profile-section-title">Caregiver</h2>
          <Field label="Caregiver Name" hint="Parent, teacher, or therapist">
            <input
              type="text"
              value={profile.caregiverName}
              onChange={(e) => updateField('caregiverName', e.target.value)}
              placeholder="Caregiver name"
            />
          </Field>
          <Field label="Caregiver Email">
            <input
              type="email"
              value={profile.caregiverEmail}
              onChange={(e) => updateField('caregiverEmail', e.target.value)}
              autoComplete="email"
              placeholder="email@example.com"
            />
          </Field>
        </section>

        {/* ── Communication Level ── */}
        <section className="profile-section">
          <h2 className="profile-section-title">Communication Level</h2>
          <div className="profile-comm-options" role="radiogroup" aria-label="Communication level">
            {COMMUNICATION_LEVELS.map((opt) => {
              const active = profile.communicationLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`profile-comm-option${active ? ' active' : ''}`}
                  onClick={() => updateField('communicationLevel', opt.value)}
                >
                  <span className="profile-comm-label">{opt.label}</span>
                  <span className="profile-comm-hint">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Save & privacy ── */}
        <section className="profile-section profile-actions">
          <button type="button" className="profile-save-btn" onClick={() => void saveNow()}>
            Save Changes
          </button>
          <p className="profile-privacy-note">
            🔒 This information is stored only on this device and is never shared.
          </p>
        </section>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="profile-field">
      <span className="profile-field-label">{label}</span>
      {children}
      {hint && <span className="profile-field-hint">{hint}</span>}
    </label>
  );
}
