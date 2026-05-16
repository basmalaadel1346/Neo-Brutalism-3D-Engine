/**
 * @typedef {Object} CardData
 * @property {string} id        - URL-safe slug, used for anchor href
 * @property {string} badge     - Category label
 * @property {string} title     - Card heading
 * @property {string} description
 * @property {{ avif?: string, webp?: string, jpeg: string }} imageFormats
 */

/** @type {CardData[]} */
export const cardsData = [
    {
        id: 'mountain-sunset-glow',
        badge: 'Nature',
        title: 'Mountain Sunset Glow',
        description: 'Serene mountain peaks bathed in the warm, golden light of the setting sun.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'modern-glass-facade',
        badge: 'Architecture',
        title: 'Modern Glass Facade',
        description: 'A study in geometry and reflection on a contemporary skyscraper\'s exterior.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'city-reflections',
        badge: 'Urban',
        title: 'City Reflections',
        description: 'Wet asphalt reflecting the neon lights and traffic of a busy downtown street after rain.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'the-silent-hunter',
        badge: 'Wildlife',
        title: 'The Silent Hunter',
        description: 'A magnificent leopard resting quietly on a tree limb in the African savanna.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'kyoto-red-gates',
        badge: 'Travel',
        title: 'Kyoto Red Gates',
        description: 'Walking through the endless vermilion torii gates of the Fushimi Inari Shrine.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'minimalist-setup',
        badge: 'Technology',
        title: 'Minimalist Setup',
        description: 'Clean workspace featuring sleek modern technology and an organized desk setup.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'coastal-gradient',
        badge: 'Aerial',
        title: 'Coastal Gradient',
        description: 'Top-down drone view of turquoise ocean waves crashing onto white sandy beaches.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'autumn-bounty',
        badge: 'Harvest',
        title: 'Autumn Bounty',
        description: 'Close-up of fresh, ripe produce harvested from local organic farms ready for market.',
        imageFormats: {
            // picsum.photos does not support fm= params; JPEG only.
            jpeg: 'https://picsum.photos/800/500',
        },
    },
    {
        id: 'geometric-shadows',
        badge: 'Abstract',
        title: 'Geometric Shadows',
        description: 'High contrast light and shadow creating sharp, abstract architectural patterns.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'cozy-coffee-break',
        badge: 'Lifestyle',
        title: 'Cozy Coffee Break',
        description: 'Perfectly poured latte art captured in a warm, inviting cafe environment.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'foggy-metropolis',
        badge: 'Landmarks',
        title: 'Foggy Metropolis',
        description: 'Iconic city landmarks piercing through a thick blanket of morning fog.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1546436836-07a91091f160?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1546436836-07a91091f160?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1546436836-07a91091f160?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'misty-forest-path',
        badge: 'Nature',
        title: 'Misty Forest Path',
        description: 'Sunbeams breaking through the canopy of an ancient, moss-covered forest.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'desert-dunes',
        badge: 'Travel',
        title: 'Desert Dunes',
        description: 'Endless rolling sand dunes shifting colors under the intense desert sun.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'classic-columns',
        badge: 'Architecture',
        title: 'Classic Columns',
        description: 'The weathered stone details of ancient classical architecture bathed in sunlight.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1529420705456-5c7e04dd043d?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1529420705456-5c7e04dd043d?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1529420705456-5c7e04dd043d?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
    {
        id: 'the-road-ahead',
        badge: 'Adventure',
        title: 'The Road Ahead',
        description: 'A winding asphalt road leading towards massive mountains under a dramatic sky.',
        imageFormats: {
            avif: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop&fm=avif&q=60',
            webp: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop&fm=webp&q=60',
            jpeg: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop&fm=jpg&q=60',
        },
    },
];