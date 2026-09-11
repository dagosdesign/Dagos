import { LifeBuoy, Shield, FileText, Info, LogOut } from 'lucide-react';
import { ProfilePage } from './ProfileFeatures';
import { C, MenuList, ProfileMenuItem, SectionHeading } from './ui';

export default function AccountSection({ open, onLogOut }: { open: (page: ProfilePage) => void; onLogOut: () => void }) {
  return (
    <section className="space-y-4">
      <SectionHeading title="Account" />
      <MenuList>
        <ProfileMenuItem icon={LifeBuoy} title="Help & Support" onClick={() => open('help')} />
        <ProfileMenuItem icon={Shield} title="Privacy Policy" onClick={() => open('privacy')} />
        <ProfileMenuItem icon={FileText} title="Terms of Use" onClick={() => open('terms')} />
        <ProfileMenuItem icon={Info} title="About Lexistencehub" onClick={() => open('about')} />
      </MenuList>

      <button
        type="button"
        onClick={onLogOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-[15px] font-medium cursor-pointer"
        style={{ color: C.muted }}
      >
        <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} /> Log Out
      </button>

      <div className="text-center pt-2 pb-2 space-y-0.5">
        <p className="text-[13px] font-semibold tracking-[0.02em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Lexistencehub
        </p>
        <p className="text-[11.5px]" style={{ color: 'rgba(165,165,165,0.55)' }}>
          Beyond English.
        </p>
      </div>
    </section>
  );
}
