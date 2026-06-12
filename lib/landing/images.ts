/** Local editorial and event image paths served from /public/images. */
export const landingImages = {
  mapPreview: "/images/map-preview.png",
  editorialCrowd: "/images/editorial-crowd.png",
  editorialDj: "/images/editorial-dj.png",
  editorialStreet: "/images/editorial-street.png",
  editorialFriends: "/images/editorial-friends.png",
  editorialSign: "/images/editorial-sign.png",
  authJar: "/images/auth-jar.png",
} as const;

export const eventImages = {
  event1: "/images/event-1.png",
  event2: "/images/event-2.png",
  event3: "/images/event-3.png",
  event4: "/images/event-4.png",
} as const;

export type LandingImageKey = keyof typeof landingImages;
