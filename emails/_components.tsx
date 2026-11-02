import { Html, Head, Body, Container, Section, Text, Button, Hr, Preview, Row, Column } from "@react-email/components";
import type { ReactNode } from "react";
import { theme } from "./theme";
import { kes } from "@/lib/utils/format";

export type OrderLine = { label: string; quantity: number; unit: number };
export type OrderBase = {
  contactName: string; orgName: string; quarterName: string;
  reference: string; lines: OrderLine[]; total: number;
};

export function Layout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: theme.bg, fontFamily: theme.font, margin: 0, padding: "24px 0", color: theme.text }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden" }}>
          <Section style={{ backgroundColor: theme.brand, padding: "18px 28px" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Home Health Education Service</Text>
            <Text style={{ color: "#fff", opacity: 0.85, fontSize: 12, margin: "2px 0 0" }}>Lesson Ordering · Kenya</Text>
          </Section>
          <Section style={{ padding: "28px" }}>{children}</Section>
          <Hr style={{ borderColor: "#E5E7E6", margin: 0 }} />
          <Section style={{ padding: "16px 28px" }}>
            <Text style={{ color: theme.muted, fontSize: 12, margin: 0, lineHeight: "18px" }}>
              {process.env.HHES_ADDRESS} · {process.env.HHES_PHONE}<br />
              {process.env.HHES_OFFICE_HOURS}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const H = ({ children }: { children: ReactNode }) =>
  <Text style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px" }}>{children}</Text>;

export const P = ({ children, muted }: { children: ReactNode; muted?: boolean }) =>
  <Text style={{ fontSize: 15, lineHeight: "24px", margin: "0 0 14px", color: muted ? theme.muted : theme.text }}>{children}</Text>;

export const Cta = ({ href, children }: { href: string; children: ReactNode }) => (
  <Section style={{ margin: "20px 0" }}>
    <Button href={href} style={{ backgroundColor: theme.brand, color: "#fff", padding: "12px 22px", borderRadius: 8, fontSize: 15, fontWeight: 600 }}>
      {children}
    </Button>
  </Section>
);

export const Callout = ({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) => (
  <Section style={{ backgroundColor: tone === "warn" ? "#FEF3F2" : theme.brandSoft, borderRadius: 8, padding: "12px 16px", margin: "0 0 16px" }}>
    <Text style={{ margin: 0, fontSize: 14, lineHeight: "22px", color: tone === "warn" ? theme.danger : theme.text }}>{children}</Text>
  </Section>
);

export function Details({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <Section style={{ margin: "0 0 16px" }}>
      {rows.map(([k, v]) => (
        <Row key={k}>
          <Column style={{ width: 150, fontSize: 13, color: theme.muted, padding: "4px 0" }}>{k}</Column>
          <Column style={{ fontSize: 14, padding: "4px 0" }}>{v}</Column>
        </Row>
      ))}
    </Section>
  );
}

export const Ref = ({ children }: { children: ReactNode }) =>
  <span style={{ fontFamily: theme.mono, fontWeight: 700 }}>{children}</span>;

export function OrderTable({ lines, total }: { lines: OrderLine[]; total: number }) {
  return (
    <Section style={{ margin: "0 0 16px", border: "1px solid #E5E7E6", borderRadius: 8, padding: "8px 14px" }}>
      {lines.map((l) => (
        <Row key={l.label}>
          <Column style={{ fontSize: 14, padding: "5px 0" }}>{l.label}</Column>
          <Column align="right" style={{ fontSize: 14, padding: "5px 0", color: theme.muted }}>{l.quantity} × {kes(l.unit)}</Column>
        </Row>
      ))}
      <Hr style={{ borderColor: "#E5E7E6", margin: "6px 0" }} />
      <Row>
        <Column style={{ fontSize: 15, fontWeight: 700, padding: "5px 0" }}>Total</Column>
        <Column align="right" style={{ fontSize: 15, fontWeight: 700, padding: "5px 0" }}>{kes(total)}</Column>
      </Row>
    </Section>
  );
}

export const OrderMeta = ({ o }: { o: OrderBase }) => (
  <P muted>{o.orgName} · {o.quarterName} · Order <Ref>{o.reference}</Ref></P>
);