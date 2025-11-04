export const calculateRevenueShare = (video) => {
  const total = video.totalRevenue || 0;
  let creatorShare = 0, originalShare = 0;

  if (!video.isShort) {
    if (video.isCopied) {
      originalShare = total * 0.2;
    } else {
      creatorShare = total * 0.6;
    }
  }

  const platformShare = total - creatorShare - originalShare;

  return { creatorShare, originalShare, platformShare };
};
