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
    <section className="p-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}
