exports.generateSlots = (shiftRanges) => {

  const slots = [];

  shiftRanges.forEach(range => {

    const [start, end] = range.split('-');

    let current =
      convertToMinutes(start);

    let finish =
      convertToMinutes(end);

    if (finish <= current) {

  finish += 24 * 60;

}

    while (current + 30 <= finish) {

      const slotStart =
        minutesToTime(current);

      const slotEnd =
        minutesToTime(current + 30);

      slots.push(
        `${slotStart}-${slotEnd}`
      );

      current += 30;

    }

  });

  return slots;

};

function convertToMinutes(time) {

  const [hour, minute] =
    time.split(':').map(Number);

  return hour * 60 + minute;

}

function minutesToTime(minutes) {

  minutes =
    minutes % (24 * 60);

  const hour =
    Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');

  const minute =
    (minutes % 60)
      .toString()
      .padStart(2, '0');

  return `${hour}:${minute}`;

}