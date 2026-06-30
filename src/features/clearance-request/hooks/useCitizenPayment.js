import { useEffect, useRef, useState } from "react";
import paymentsService from "../../../services/paymentsService";
import merchantCallbackService from "../../../services/merchantCallbackService";
import { transferVoucherService } from "../../../services/transferVoucherService";
import { fetchMyRequests } from "../../../services/certificateRequestService";

/**
 * useCitizenPayment
 *
 * Handles all payment & HPG-verification side-effects for a citizen:
 *  - Initiating TLPE payment
 *  - Verifying the payment redirect callback (transactionId in URL)
 *  - Fetching/assigning the voucher after payment
 *  - Polling for HPG verification
 */
export const useCitizenPayment = ({
  id,
  step,
  orCr,
  crCr,
  paymentDone,
  voucherAssigned,
  voucherCode,
  hpgVerified,
  paymentTransactionId,
  selectedRequest,
  setPaymentDone,
  setVoucherCode,
  setVoucherAssigned,
  setHpgVerified,
  setRequestStatus,
  setStep,
  setAvailableVoucherRequests,
  saveCitizenRequest,
  showError,
  navigate,
}) => {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [issuingVoucher, setIssuingVoucher]       = useState(false);
  const [fetchVoucherFailed, setFetchVoucherFailed] = useState(false);

  const handledPaymentTransactionRef = useRef("");

  // ── Initiate TLPE Payment ───────────────────────────────────────────────────

  const handleProceedToPayment = async () => {
    if (processingPayment) return;

    const storedProfile  = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const storedFirstName = localStorage.getItem("firstname") || storedProfile.firstName || "";
    const storedLastName  = localStorage.getItem("lastname")  || storedProfile.lastName  || "";
    const storedEmail     = localStorage.getItem("email")     || storedProfile.email     || "";
    const storedMobile    = localStorage.getItem("mobile")    || storedProfile.mobile    || "";
    const companyId       = Number(localStorage.getItem("companyId") || storedProfile.companyId || 0);
    const companyCode     = localStorage.getItem("companyCode") || storedProfile.companyCode || "";

    const ownerName       = (orCr.ownerName || crCr.ownerName || "").trim();
    const ownerNameParts  = ownerName.split(/\s+/).filter(Boolean);
    const fallbackFirstName = ownerNameParts[0] || "Citizen";
    const fallbackLastName  = ownerNameParts.slice(1).join(" ") || "User";
    const billingLine     = orCr.ownerAddress || crCr.ownerAddress || storedProfile.address || "";

    if (!companyId || !companyCode) {
      console.error("[Clearance] Payment setup failed: missing company information", { id, companyId, companyCode });
      await showError("Payment Setup Failed", "Missing company information required for payment processing.");
      return;
    }

    const callbackUrl = `${window.location.origin}/dci-access/new-clearance-request?id=${encodeURIComponent(id)}&step=3`;
    const paymentRequest = {
      customer: {
        contact: { email: storedEmail, mobile: storedMobile },
        first_name: storedFirstName || fallbackFirstName,
        last_name:  storedLastName  || fallbackLastName,
        billing_address: {
          line1: billingLine, line2: "", zip: "",
          city_municipality: "", state_province_region: "", country_code: "PH",
        },
      },
      payment: {
        description: "DCI Clearance Request Fee",
        amount: "60.00",
        currency: "PHP",
        merchant_reference_id: id,
      },
      route: { callback_url: callbackUrl, notify_user: true },
      company_id: companyId,
      company_code: companyCode,
      voucher_fee: 60,
      voucher_count: 1,
    };

    console.log("[Clearance] TLPE payment request body:", { paymentRequest });
    setProcessingPayment(true);

    try {
      const response = await paymentsService.createTlpePayment(paymentRequest);
      const payload  = response?.data || {};
      const paymentLink = payload.link;

      if (!paymentLink) throw new Error("Payment gateway link was not returned.");

      saveCitizenRequest({
        currentStep: 2,
        status: "PAYMENT_PENDING",
        paymentDone: false,
        tlpeOrderId: payload.order_id || payload.orderId || null,
        merchantReferenceId: payload.merchant_reference_id || payload.merchantReferenceId || "",
        paymentLink,
      });

      window.location.assign(paymentLink);
    } catch (error) {
      console.error("[Clearance] TLPE payment initialization failed", {
        id, paymentRequest, error: { message: error?.message, response: error?.response?.data },
      });
      setProcessingPayment(false);
      setPaymentDone(true);
      setRequestStatus("PENDING");
      setStep(3);
      saveCitizenRequest({ currentStep: 3, status: "PENDING", paymentDone: true });
    }
  };

  // ── Verify Payment Redirect ──────────────────────────────────────────────────

  useEffect(() => {
    if (!paymentTransactionId) return;
    if (handledPaymentTransactionRef.current === paymentTransactionId) return;
    if (paymentDone || step >= 3) return;

    handledPaymentTransactionRef.current = paymentTransactionId;
    let active = true;

    const verifyPaymentRedirect = async () => {
      setProcessingPayment(true);
      try {
        const result =
          await merchantCallbackService.fetchSummary(paymentTransactionId);
        const payload = result?.data || {};
        const statusCode = String(payload.statusCode || "").toUpperCase();
        const paymentFailed =
          result?.success === false ||
          (statusCode && statusCode.startsWith("ER"));

        if (paymentFailed) {
          throw new Error(
            payload.voucherStatusLabel ||
              payload.report?.result?.message ||
              result?.message ||
              "Payment was not completed.",
          );
        }

        if (!active) return;

        setPaymentDone(true);
        setRequestStatus("PENDING");
        setStep(3);
        saveCitizenRequest({
          currentStep: 3,
          status: "PENDING",
          paymentDone: true,
          tlpeTransactionId: paymentTransactionId,
          merchantReferenceId: payload.merchantReference || "",
          paymentReference: payload.paymentReference || "",
        });
        navigate(
          `/dci-access/new-clearance-request?id=${encodeURIComponent(id)}`,
          { replace: true },
        );
      } catch (error) {
        if (!active) return;

        setRequestStatus("PAYMENT_FAILED");
        saveCitizenRequest({
          currentStep: 2,
          status: "PAYMENT_FAILED",
          paymentDone: false,
          tlpeTransactionId: paymentTransactionId,
        });
        await showError(
          "Payment Verification Failed",
          error?.message || "Unable to confirm payment.",
        );
        navigate(
          `/dci-access/new-clearance-request?id=${encodeURIComponent(id)}`,
          { replace: true },
        );
      } finally {
        if (active) {
          setProcessingPayment(false);
        }
      }
    };

    verifyPaymentRedirect();

    return () => {
      active = false;
      if (handledPaymentTransactionRef.current === paymentTransactionId) {
        handledPaymentTransactionRef.current = "";
      }
    };
  }, [
    navigate, paymentTransactionId, id, showError, paymentDone, step,
    saveCitizenRequest, setPaymentDone, setRequestStatus, setStep
  ]);

  // ── Fetch Voucher after Payment ────────────────────────────────────────────

  useEffect(() => {
    if (step !== 3 || !paymentDone || voucherAssigned || issuingVoucher || fetchVoucherFailed) return;

    setIssuingVoucher(true);

    const fetchVoucher = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) throw new Error("User ID not found");

        const vouchers       = await transferVoucherService.getVouchersByUser(userId);
        const sortedVouchers = [...vouchers].sort((a, b) => b.id - a.id);
        const txnId          = paymentTransactionId || selectedRequest?.tlpeTransactionId;

        const activeVoucher =
          (txnId ? sortedVouchers.find((v) => v.tlpeTransactionId === txnId) : null) ||
          sortedVouchers.find((v) => v.status === "AVAILABLE") ||
          sortedVouchers.find((v) => v.status === "REDEEMED") ||
          sortedVouchers[0];

        if (activeVoucher?.voucherCode) {
          const code = activeVoucher.voucherCode;
          setVoucherCode(code);
          setVoucherAssigned(true);
          setRequestStatus("VOUCHER_ISSUED");
          saveCitizenRequest({
            currentStep: 3,
            status: "VOUCHER_ISSUED",
            voucherCode: code,
            voucherReferenceNo: code,
            voucherAssigned: true,
            voucherStatus: "VOUCHER_ISSUED",
          });
        } else {
          throw new Error("No voucher found for the user.");
        }
      } catch (error) {
        console.error("[Clearance] Failed to fetch voucher:", error);
        setFetchVoucherFailed(true);
        showError("Voucher Issue Failed", error.message || "Failed to fetch the voucher from the server.");
      } finally {
        setIssuingVoucher(false);
      }
    };

    fetchVoucher();
  }, [
    issuingVoucher, paymentDone, step, voucherAssigned,
    voucherCode, fetchVoucherFailed, paymentTransactionId,
    selectedRequest?.tlpeTransactionId,
  ]);

  // ── Poll for HPG Verification ──────────────────────────────────────────────

  useEffect(() => {
    const isHpgStep = step === 5;
    if (!isHpgStep || hpgVerified) return;

    let intervalId;
    let isActive = true;

    const pollRequestStatus = async () => {
      try {
        const records = await fetchMyRequests();
        if (!isActive) return;
        const currentRecord = records.find((r) => String(r.id) === String(id));
        if (currentRecord) {
          const isVerified = Boolean(
            currentRecord.hpgVerified || currentRecord.status === "HPG_VERIFIED"
          );
          if (isVerified) {
            setHpgVerified(true);
            setRequestStatus("HPG_VERIFIED");
            setAvailableVoucherRequests(records);
          }
        }
      } catch (err) {
        console.error("Error polling request status:", err);
      }
    };

    pollRequestStatus();
    intervalId = setInterval(pollRequestStatus, 3000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [id, step, hpgVerified, setAvailableVoucherRequests]);



  return {
    processingPayment,
    issuingVoucher,
    fetchVoucherFailed,
    handledPaymentTransactionRef,
    handleProceedToPayment,
  };
};
