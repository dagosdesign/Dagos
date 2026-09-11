import { useRef, useState, type ReactNode } from 'react';
import { Camera } from 'lucide-react';
import { C, Card, GhostButton, GoldButton, SubPage } from '../../components/profile/ui';
import { Avatar } from '../../components/profile/StudentIdentityCard';
import { updateUserProfile, useUserProfile } from '../../lib/userProfile';

/* Reads a photo and scales it down to a small square, so it fits comfortably
   in the profile saved on the device. */
function resizePhoto(file: File, size = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('This file is not an image.'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function cleanUsername(value: string): string {
  const handle = value.toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_.]/g, '').slice(0, 24);
  return `@${handle}`;
}

export default function PersonalInfoPage({ onBack, notify }: { onBack: () => void; notify: (msg: string) => void }) {
  const profile = useUserProfile();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    const n = name.trim();
    const u = cleanUsername(username);
    if (!n) return setError('Please enter your name.');
    if (u.length < 4) return setError('Your username needs at least 3 letters or numbers.');
    updateUserProfile({ name: n, username: u });
    setError(null);
    notify('Personal information saved');
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const image = await resizePhoto(file);
      updateUserProfile({ profileImage: image });
      notify('Profile photo updated');
    } catch (e) {
      setError((e as Error).message || 'The photo could not be read.');
    }
  };

  return (
    <SubPage title="Personal Information" subtitle="Name, username and profile photo" onBack={onBack}>
      <Card className="p-5 flex flex-col items-center gap-4">
        <Avatar profile={profile} size={112} />
        <div className="flex gap-2 w-full max-w-xs">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-[14px] cursor-pointer"
            style={{ borderColor: C.border, color: C.text }}
          >
            <Camera className="w-4 h-4" color={C.gold} /> Change Photo
          </button>
          {profile.profileImage && (
            <button
              type="button"
              onClick={() => updateUserProfile({ profileImage: undefined })}
              className="rounded-2xl border px-4 py-2.5 text-[14px] cursor-pointer"
              style={{ borderColor: C.border, color: C.muted }}
            >
              Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => pickPhoto(e.target.files?.[0])} />
      </Card>

      <Card className="p-5 space-y-4">
        <Field label="Name">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            autoComplete="name"
            className="w-full rounded-2xl border px-4 py-3 text-[15px] outline-none focus:border-[#F5B82E]"
            style={{ background: C.card2, borderColor: C.border, color: C.text }}
          />
        </Field>
        <Field label="Username">
          <input
            value={username}
            onChange={e => setUsername(cleanUsername(e.target.value))}
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-2xl border px-4 py-3 text-[15px] outline-none focus:border-[#F5B82E]"
            style={{ background: C.card2, borderColor: C.border, color: C.text }}
          />
        </Field>
        {error && (
          <p className="text-[13px]" style={{ color: C.gold }}>
            {error}
          </p>
        )}
        <GoldButton onClick={save}>Save Changes</GoldButton>
        <GhostButton onClick={onBack}>Cancel</GhostButton>
      </Card>
    </SubPage>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[13px]" style={{ color: C.muted }}>
        {label}
      </span>
      {children}
    </label>
  );
}
