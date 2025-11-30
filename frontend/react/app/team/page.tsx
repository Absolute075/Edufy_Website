const defaultAvatarUrl =
  'https://resources.edufyuzbekistan.com/storage/images/10d554ea6f330f1612526b54562c8a33.jpg';

const teamSections = [
  {
    title: 'Founders',
    members: [
      {
        name: 'Asilbek',
        role: 'CEO & Co-Founder',
        avatarUrl:
          'https://resources.edufyuzbekistan.com/storage/images/photo_2025-10-30_18-03-35.jpg',
      },
      {
        name: 'Behruz',
        role: 'CTO & Co-Founder',
        avatarUrl:
          'https://resources.edufyuzbekistan.com/storage/images/photo_2025-10-20_20-22-58.jpg',
      },
      {
        name: 'Founder Member 3',
        role: 'Co-Founder & CCO',
        avatarUrl: defaultAvatarUrl,
      },
    ],
  },
  {
    title: 'Engineering',
    members: [
      {
        name: 'Behruz',
        role: 'Software Engineer',
        avatarUrl:
          'https://resources.edufyuzbekistan.com/storage/images/photo_2025-10-20_20-22-58.jpg',
      },
    ],
  },
  {
    title: 'UI/UX Design',
    members: [
      {
        name: 'I. Ruslan',
        role: 'Mobile Designer',
        avatarUrl: defaultAvatarUrl,
      },
      {
        name: 'N. Otamurod',
        role: 'Mobile Designer',
        avatarUrl: defaultAvatarUrl,
      },
      {
        name: 'Behruz',
        role: 'Product Designer',
        avatarUrl:
            'https://resources.edufyuzbekistan.com/storage/images/photo_2025-10-20_20-22-58.jpg',
      },
    ],
  },
  {
    title: 'Content Production',
    members: [
      { name: 'R. Zaynab', role: 'Copywriter', avatarUrl: defaultAvatarUrl },
      { name: 'Feride', role: 'Content Producer', avatarUrl: defaultAvatarUrl },
      { name: 'Otabek', role: 'Content Producer', avatarUrl: defaultAvatarUrl },
      { name: 'E. Sevinch', role: 'Copywriter', avatarUrl: defaultAvatarUrl },
      { name: 'Bakhtiyor', role: 'Copywriter', avatarUrl: defaultAvatarUrl },
      { name: 'D. Sevara', role: 'Copywriter', avatarUrl: defaultAvatarUrl },
      { name: 'Shokh', role: 'Copywriter', avatarUrl: defaultAvatarUrl },
    ],
  },
  {
    title: 'Academics',
    members: [
      { name: 'A. Jurabek', role: 'IELTS Lead', avatarUrl: defaultAvatarUrl },
      { name: 'Reporter', role: 'IELTS Lead', avatarUrl: defaultAvatarUrl },
      { name: 'Reporter', role: 'IELTS Lead', avatarUrl: defaultAvatarUrl },
    ],
  },
  {
    title: 'Advisor',
    members: [
      { name: 'Sh. Mushtariy', role: 'IELTS Advisor', avatarUrl: defaultAvatarUrl },
    ],
  },
];

export default function TeamPage() {
  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <header className="mb-12 legal-hero-block">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bebas tracking-[0.35em] uppercase text-left text-white">
            Our Team
          </h1>
        </header>

        <div className="space-y-10 legal-content-block">
          {teamSections.map((section) => (
            <section key={section.title} className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs sm:text-sm tracking-[0.25em] uppercase text-gray-400 font-bebas">
                  {section.title}
                </h2>
                <span className="text-[11px] sm:text-xs text-gray-500">
                  {section.members.length.toString().padStart(2, '0')} people
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {section.members.map((member, index) => (
                  <div
                    key={index}
                    className="team-card rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col items-center gap-3"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
                      <img
                        src={member.avatarUrl}
                        alt={`${member.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{member.name}</p>
                      {member.role && (
                        <p className="text-xs text-gray-400 mt-0.5">{member.role}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
