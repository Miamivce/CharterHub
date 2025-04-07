import React, { useState } from 'react';
import { customerService } from '@/services/customerService';

interface CustomerDetailsProps {
  customerId: string | number;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customerId }) => {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState<boolean>(false);
  const [inviteLinkError, setInviteLinkError] = useState<string | null>(null);
  const [showInviteLinkDialog, setShowInviteLinkDialog] = useState<boolean>(false);
  const [showForceInviteDialog, setShowForceInviteDialog] = useState<boolean>(false);
  const [invitationStatus, setInvitationStatus] = useState<any>(null);

  const generateInviteLink = async (forceGenerate = false) => {
    try {
      setGeneratingLink(true);
      setInviteLinkError(null);

      console.log(`[CustomerDetails] Generating invitation link for customer ID ${customerId}`);

      // Validate customer ID
      const customerIdNumber = Number(customerId);
      if (isNaN(customerIdNumber) || customerIdNumber <= 0) {
        throw new Error('Invalid customer ID');
      }

      // Generate the invitation link
      const link = await customerService.getInviteLink(customerIdNumber, forceGenerate);

      // Set the invitation link and refresh data
      setInviteLink(link);
      setShowInviteLinkDialog(true);

      // Refresh invitation status after generating link
      // Use setTimeout to allow UI to update first and ensure consistent state
      setTimeout(async () => {
        try {
          const status = await customerService.checkInvitationStatus(customerId.toString());
          console.log('[CustomerDetails] Invitation status checked:', status);
          setInvitationStatus(status);
        } catch (statusError) {
          console.warn(
            '[CustomerDetails] Error checking invitation status:',
            statusError instanceof Error ? statusError.message : 'Unknown error'
          );
          // Non-critical error, don't block the flow
        }
      }, 1000);
    } catch (err) {
      console.error('[CustomerDetails] Failed to generate invite link:', err);

      // Handle specific error types
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (
        errorMessage.includes('already registered') ||
        errorMessage.includes('completed account setup')
      ) {
        setInviteLinkError('This client has already registered and completed their account setup.');

        // Show force invitation dialog
        setShowForceInviteDialog(true);
      } else if (
        errorMessage.includes('CORS') ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('network issues')
      ) {
        setInviteLinkError(
          "Network error when generating the invitation link. The link may have been generated but couldn't be retrieved. " +
            'Please try refreshing the page or check the invitation status.'
        );
      } else {
        setInviteLinkError(`Failed to generate invitation link: ${errorMessage}`);
      }
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <div className="customer-details">
      {/* Component implementation goes here */}
    </div>
  );
};

export default CustomerDetails;
