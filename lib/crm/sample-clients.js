/**
 * Starter CRM contacts inserted once when a freelancer has no clients yet.
 * Emails use a reserved-style domain so they are unlikely to collide with real clients.
 */
export const CRM_SAMPLE_CLIENT_FIXTURES = [
  {
    full_name: "Maya Chen",
    email: "maya.chen@mably-sample.invalid",
    phone: "+1 (415) 555-0142",
    location: "San Francisco, CA",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    links: [{ label: "Acme Studio", url: "https://example.com" }],
    daysAgoUpdated: 1,
  },
  {
    full_name: "James Okonkwo",
    email: "james.okonkwo@mably-sample.invalid",
    phone: "+44 20 7946 0958",
    location: "London, UK",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    links: [{ label: "LinkedIn", url: "https://linkedin.com" }],
    daysAgoUpdated: 4,
  },
  {
    full_name: "Sofia Martinez",
    email: "sofia.martinez@mably-sample.invalid",
    phone: "+1 (512) 555-0198",
    location: "Austin, TX",
    avatar_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    links: [],
    daysAgoUpdated: 9,
  },
];
