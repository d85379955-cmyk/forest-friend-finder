import React from "react";
import { MessageSquare, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface SMSStatusProps {
  hasSent: boolean;
  isOnline: boolean;
  sosActive: boolean;
  contactsCount: number;
}

export const SMSStatus: React.FC<SMSStatusProps> = ({
  hasSent,
  isOnline,
  sosActive,
  contactsCount,
}) => {
  if (!sosActive) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Auto-SMS Status</h3>
          <p className="text-xs text-muted-foreground">
            {hasSent ? "Messages sent" : "Waiting for signal..."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Network Status */}
        <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Network Signal</span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <CheckCircle className="w-4 h-4 text-safe" />
                <span className="text-sm text-safe font-medium">Available</span>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 text-warning animate-spin" />
                <span className="text-sm text-warning font-medium">Scanning...</span>
              </>
            )}
          </div>
        </div>

        {/* SMS Status */}
        <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Emergency SMS</span>
          <div className="flex items-center gap-2">
            {hasSent ? (
              <>
                <CheckCircle className="w-4 h-4 text-safe" />
                <span className="text-sm text-safe font-medium">
                  Sent to {contactsCount} contacts
                </span>
              </>
            ) : isOnline ? (
              <>
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-primary font-medium">Sending...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          {hasSent
            ? "✅ All emergency contacts have been notified with your GPS location."
            : "SMS will be sent automatically when network signal is detected."}
        </p>
      </div>
    </div>
  );
};
