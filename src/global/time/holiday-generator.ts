import { format } from 'date-fns';

export const holidayGenerator = (startDate: any, endDate: any) => {
  const holiday: any = [];

  for (let date = new Date(startDate); date <= new Date(endDate); ) {
    /*
      First format the date and then find the day name
    */
    const formatedDate = new Date(date);
    const day = format(formatedDate, 'EEEE');

    /* 
    Check if the date is holiday 
    */
    if (day == 'Saturday' || day == 'Sunday') {
      holiday.push(new Date(formatedDate.toUTCString().slice(0, -4)));
    }

    /*  
      seconds * minutes * hours * milliseconds = 1 day
      Increase date by one day
    */
    const oneDay = 60 * 60 * 24 * 1000;
    date = new Date(formatedDate.getTime() + oneDay);
  }

  return holiday;
};
