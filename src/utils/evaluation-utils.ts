
export const calculateAccuracy = (predicted: string, actual: string): number => {
  const grades = ["12", "10", "7", "4", "02", "00", "-3"];
  const predictedIndex = grades.indexOf(predicted);
  const actualIndex = grades.indexOf(actual);
  
  const maxDistance = grades.length - 1;
  const distance = Math.abs(predictedIndex - actualIndex);
  const accuracy = 1 - (distance / maxDistance);
  
  return Number(accuracy.toFixed(2));
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("da-DK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
