interface WikiSectionProps {
  title: string
  content: string
}

export function WikiSection({ title, content }: WikiSectionProps) {
  if (!content || content.trim() === '') {
    return null
  }
  
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim() !== '')
  
  return (
    <section className="py-4 px-2 md:p-4">
      <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">{title}</h2>
      <div className="space-y-3 md:space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-sm md:text-base">{paragraph}</p>
        ))}
      </div>
    </section>
  )
}
