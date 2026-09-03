import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { organizerSignUp, sendOtp } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import {
  organizerAccountSchema,
  organizerOrgSchema,
  otpSchema,
  type OrganizerAccountValues,
  type OrganizerOrgValues,
} from "@/features/auth/schemas";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { colors } from "@/lib/theme";

const ORGANIZER_TYPES = [
  "Individual",
  "Company / Business",
  "Non-profit / NGO",
  "Educational Institution",
  "Other",
];

const STEP_LABELS = ["Account", "Organization", "Verify phone", "Review"];

type FormErrors = Record<string, string>;

export default function OrganizerSignUpScreen() {
  const [step, setStep] = useState(0);

  const [account, setAccount] = useState<OrganizerAccountValues>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [org, setOrg] = useState<OrganizerOrgValues>({
    organization: "",
    organizerType: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);

  const [accountErrors, setAccountErrors] = useState<FormErrors>({});
  const [orgErrors, setOrgErrors] = useState<FormErrors>({});
  const [otpError, setOtpError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sendOtpMutation = useMutation({
    mutationFn: () => sendOtp(account.phone),
    onSuccess: () => setOtpSentTo(account.phone),
  });

  const signUpMutation = useMutation({
    mutationFn: () =>
      organizerSignUp({
        name: account.name,
        email: account.email,
        phone: account.phone,
        password: account.password,
        organization: org.organization,
        organizerType: org.organizerType,
      }),
    onSuccess: () => setSubmitted(true),
  });

  function goToStep2() {
    const parsed = organizerAccountSchema.safeParse(account);
    if (!parsed.success) {
      const errors: FormErrors = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setAccountErrors(errors);
      return;
    }
    setAccountErrors({});
    setStep(1);
  }

  function goToStep3() {
    const parsed = organizerOrgSchema.safeParse(org);
    if (!parsed.success) {
      const errors: FormErrors = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setOrgErrors(errors);
      return;
    }
    setOrgErrors({});
    setStep(2);
  }

  function goToStep4() {
    const parsed = otpSchema.safeParse(otp);
    if (!parsed.success) {
      setOtpError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code");
      return;
    }
    setOtpError(null);
    setStep(3);
  }

  if (submitted) {
    return <SignUpSuccess email={account.email} />;
  }

  return (
    <Screen>
      <StepIndicator activeIndex={step} />

      {step === 0 && (
        <AccountStep
          value={account}
          errors={accountErrors}
          onChange={setAccount}
          onNext={goToStep2}
        />
      )}
      {step === 1 && (
        <OrgStep
          value={org}
          errors={orgErrors}
          onChange={setOrg}
          onBack={() => setStep(0)}
          onNext={goToStep3}
        />
      )}
      {step === 2 && (
        <VerifyPhoneStep
          phone={account.phone}
          otp={otp}
          onChangeOtp={setOtp}
          otpError={otpError}
          otpSentTo={otpSentTo}
          isSending={sendOtpMutation.isPending}
          sendError={sendOtpMutation.isError ? bannerMessageFor(sendOtpMutation.error) : null}
          onSendOtp={() => sendOtpMutation.mutate()}
          onBack={() => setStep(1)}
          onNext={goToStep4}
        />
      )}
      {step === 3 && (
        <ReviewStep
          account={account}
          org={org}
          isSubmitting={signUpMutation.isPending}
          submitError={signUpMutation.isError ? bannerMessageFor(signUpMutation.error) : null}
          onBack={() => setStep(2)}
          onSubmit={() => signUpMutation.mutate()}
        />
      )}
    </Screen>
  );
}

function StepIndicator({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={styles.stepRow}>
      {STEP_LABELS.map((label, index) => (
        <View key={label} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              index <= activeIndex && styles.stepDotActive,
            ]}
          >
            <Text
              style={[
                styles.stepDotText,
                index <= activeIndex && styles.stepDotTextActive,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={[styles.stepLabel, index === activeIndex && styles.stepLabelActive]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AccountStep({
  value,
  errors,
  onChange,
  onNext,
}: {
  value: OrganizerAccountValues;
  errors: FormErrors;
  onChange: (v: OrganizerAccountValues) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Create your account</Text>
      <TextField
        label="Full name"
        value={value.name}
        onChangeText={(name) => onChange({ ...value, name })}
        error={errors.name}
        placeholder="Abebe Kebede"
      />
      <TextField
        label="Email"
        value={value.email}
        onChangeText={(email) => onChange({ ...value, email })}
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <TextField
        label="Phone number"
        value={value.phone}
        onChangeText={(phone) => onChange({ ...value, phone })}
        error={errors.phone}
        keyboardType="phone-pad"
        placeholder="0912345678"
      />
      <TextField
        label="Password"
        value={value.password}
        onChangeText={(password) => onChange({ ...value, password })}
        error={errors.password}
        secureTextEntry
        placeholder="At least 8 characters"
      />
      <Button label="Continue" onPress={onNext} style={styles.primaryAction} />
    </View>
  );
}

function OrgStep({
  value,
  errors,
  onChange,
  onBack,
  onNext,
}: {
  value: OrganizerOrgValues;
  errors: FormErrors;
  onChange: (v: OrganizerOrgValues) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>About your organization</Text>
      <TextField
        label="Organization name"
        value={value.organization}
        onChangeText={(organization) => onChange({ ...value, organization })}
        error={errors.organization}
        placeholder="e.g. Habesha Events"
      />

      <View style={styles.chipField}>
        <Text style={styles.chipLabel}>What best describes you?</Text>
        <View style={styles.chipRow}>
          {ORGANIZER_TYPES.map((type) => {
            const active = value.organizerType === type;
            return (
              <Pressable
                key={type}
                onPress={() => onChange({ ...value, organizerType: type })}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.organizerType ? (
          <Text style={styles.chipError}>{errors.organizerType}</Text>
        ) : null}
      </View>

      <View style={styles.rowButtons}>
        <Button label="Back" variant="secondary" onPress={onBack} style={styles.flexButton} />
        <Button label="Continue" onPress={onNext} style={styles.flexButton} />
      </View>
    </View>
  );
}

function VerifyPhoneStep({
  phone,
  otp,
  onChangeOtp,
  otpError,
  otpSentTo,
  isSending,
  sendError,
  onSendOtp,
  onBack,
  onNext,
}: {
  phone: string;
  otp: string;
  onChangeOtp: (v: string) => void;
  otpError: string | null;
  otpSentTo: string | null;
  isSending: boolean;
  sendError: string | null;
  onSendOtp: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Verify your phone</Text>
      <Text style={styles.stepSubtitle}>
        We'll text a 6-digit code to {phone}.
      </Text>

      {sendError ? <Banner kind="error" message={sendError} /> : null}
      {otpSentTo ? (
        <Banner kind="success" message={`Code sent to ${otpSentTo}.`} />
      ) : null}

      <Button
        label={otpSentTo ? "Resend code" : "Send code"}
        variant="secondary"
        onPress={onSendOtp}
        loading={isSending}
      />

      <View style={styles.otpWrap}>
        <OtpInput value={otp} onChange={onChangeOtp} />
        {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}
      </View>

      <View style={styles.rowButtons}>
        <Button label="Back" variant="secondary" onPress={onBack} style={styles.flexButton} />
        <Button label="Continue" onPress={onNext} style={styles.flexButton} />
      </View>
    </View>
  );
}

function ReviewStep({
  account,
  org,
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: {
  account: OrganizerAccountValues;
  org: OrganizerOrgValues;
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Review & submit</Text>

      {submitError ? <Banner kind="error" message={submitError} /> : null}

      <View style={styles.summaryCard}>
        <SummaryRow label="Name" value={account.name} />
        <SummaryRow label="Email" value={account.email} />
        <SummaryRow label="Phone" value={account.phone} />
        <SummaryRow label="Organization" value={org.organization} />
        <SummaryRow label="Type" value={org.organizerType} />
      </View>

      <Text style={styles.disclaimer}>
        Your account will be reviewed by the Pazimo team before you can sign
        in. This usually takes a short while.
      </Text>

      <View style={styles.rowButtons}>
        <Button
          label="Back"
          variant="secondary"
          onPress={onBack}
          style={styles.flexButton}
          disabled={isSubmitting}
        />
        <Button
          label="Submit application"
          onPress={onSubmit}
          loading={isSubmitting}
          style={styles.flexButton}
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value || "—"}
      </Text>
    </View>
  );
}

function SignUpSuccess({ email }: { email: string }) {
  return (
    <Screen scroll={false}>
      <View style={styles.successContainer}>
        <View style={styles.successBadge}>
          <Text style={styles.successBadgeText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Application submitted</Text>
        <Text style={styles.successBody}>
          We've received your organizer application for {email}. The Pazimo
          team will review it and activate your account — you'll be able to
          sign in once that's done.
        </Text>
        <Button
          label="Back to sign in"
          onPress={() => router.replace("/")}
          style={styles.successButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  stepDotTextActive: {
    color: colors.surface,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.ink,
    fontWeight: "600",
  },
  form: {
    gap: 16,
  },
  stepTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: -8,
  },
  primaryAction: {
    marginTop: 8,
  },
  rowButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  flexButton: {
    flex: 1,
  },
  chipField: {
    gap: 8,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.surface,
  },
  chipError: {
    fontSize: 13,
    color: colors.error,
  },
  otpWrap: {
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  otpErrorText: {
    fontSize: 13,
    color: colors.error,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    flexShrink: 1,
    textAlign: "right",
  },
  disclaimer: {
    fontSize: 13,
    color: colors.textMuted,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  successBadgeText: {
    fontSize: 28,
    color: colors.success,
    fontWeight: "700",
  },
  successTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
  },
  successBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  successButton: {
    marginTop: 8,
    alignSelf: "stretch",
  },
});
