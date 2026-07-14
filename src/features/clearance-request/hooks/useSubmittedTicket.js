import { useState, useEffect } from "react";
import { ticketService } from "../../../services/ticketService";

/**
 * Custom hook to find and state-manage a submitted support ticket matching
 * the current clearance request's ID or vehicle plate number.
 */
export const useSubmittedTicket = (id, plate) => {
  const [submittedTicket, setSubmittedTicket] = useState(null);

  useEffect(() => {
    const checkForExistingTicket = async () => {
      if (!id) return;
      try {
        const tickets = await ticketService.getAll();
        const matched = tickets.find(t => 
          (plate && String(t.plateNo || t.vehicleInfo?.plateNo).toUpperCase() === String(plate).toUpperCase()) || 
          (t.referenceNumber && t.referenceNumber.includes(id))
        );
        if (matched) {
          setSubmittedTicket(matched);
        }
      } catch (e) {
        console.error("Failed to check existing tickets", e);
      }
    };
    checkForExistingTicket();
  }, [id, plate]);

  return [submittedTicket, setSubmittedTicket];
};
