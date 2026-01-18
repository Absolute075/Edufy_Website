import { FooterPagesHeader } from "@/components/FooterPagesHeader";

export default function ReviewsPage() {
  const reviews = [
    {
      name: 'Jamshid',
      role: 'IELTS learner',
      text: 'With Edufy I finally understood where I was losing points in Reading and Listening. After a few months my confidence and scores improved significantly.',
    },
    {
      name: 'Malika',
      role: 'IELTS learner',
      text: 'The tests feel like the real exam. I could track every attempt and see how my weak points changed over time.',
    },
    {
      name: 'Sherzod',
      role: 'IELTS learner',
      text: 'Short, focused practice sessions every day gave me more progress than long chaotic study blocks. Analytics helped me stay on track.',
    },
    {
      name: 'Feruza',
      role: 'IELTS learner',
      text: 'Edufy made it easy to see exactly which question types I struggled with. I stopped guessing and started practicing with intention.',
    },
    {
      name: 'Aziz',
      role: 'University applicant',
      text: 'I liked how everything was in one place: tasks, explanations and progress. It felt like having a personal exam coach.',
    },
    {
      name: 'Nilufar',
      role: 'IELTS learner',
      text: 'I am really waiting subscription system',
    },
  ];

  return (
    <main className="min-h-screen text-white legal-page-main">
      <FooterPagesHeader />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <header className="mb-12 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-left text-white">
            Reviews
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl text-left">
            What learners and families say about studying with Edufy.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 legal-content-block">
          {reviews.map((review) => (
            <article
              key={review.name + review.role}
              className="reviews-card relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md p-8 flex flex-col gap-5"
            >
              <p className="text-sm md:text-base text-gray-100">“{review.text}”</p>

              <div className="mt-auto pt-3 border-t border-white/10 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-yellow-400">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <span className="text-sm font-semibold text-white">{review.name}</span>
                <span className="text-xs text-gray-400">{review.role}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
