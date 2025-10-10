'use server'

// Server actions to expose AI flows
export async function analyzeImageAction(imageDataUri: string, mimeType: string) {
  try {
    // This would normally call the Genkit flow
    // For now, return mock data until dependencies are installed
    return {
      tags: ['anthro', 'canine', 'wolf', 'digital_art', 'solo'],
      confidence: 0.85
    }
  } catch (error) {
    console.error('Error in analyzeImageAction:', error)
    return {
      tags: [],
      confidence: 0
    }
  }
}

export async function enhancePostDetailsWithRelatedLinksAction(
  tags: string[], 
  description?: string, 
  artist?: string, 
  species?: string[]
) {
  try {
    // This would normally call the Genkit flow
    // For now, return mock data until dependencies are installed
    const relatedLinks = []

    if (artist) {
      relatedLinks.push({
        title: `More by ${artist}`,
        url: `https://e621.net/posts?tags=artist:${artist.toLowerCase().replace(/\s+/g, '_')}`,
        description: `View more artwork by ${artist}`,
        category: 'artist'
      })
    }

    // Add species-based links
    if (species) {
      species.forEach(sp => {
        if (sp && relatedLinks.length < 6) {
          relatedLinks.push({
            title: `${sp} posts`,
            url: `https://e621.net/posts?tags=${sp.toLowerCase()}`,
            description: `Browse all ${sp} related posts`,
            category: 'species'
          })
        }
      })
    }

    // Add some popular tag searches
    const popularTags = tags.filter(tag => 
      ['anthro', 'feral', 'digital_art', 'sketch', 'commission'].indexOf(tag) !== -1
    ).slice(0, 3)

    popularTags.forEach(tag => {
      if (relatedLinks.length < 8) {
        relatedLinks.push({
          title: `${tag.replace(/_/g, ' ')} posts`,
          url: `https://e621.net/posts?tags=${tag}`,
          description: `Browse posts tagged with ${tag.replace(/_/g, ' ')}`,
          category: 'reference'
        })
      }
    })

    return {
      relatedLinks: relatedLinks.slice(0, 8)
    }
  } catch (error) {
    console.error('Error in enhancePostDetailsWithRelatedLinksAction:', error)
    return {
      relatedLinks: []
    }
  }
}