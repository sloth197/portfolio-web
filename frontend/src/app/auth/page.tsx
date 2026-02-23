"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type VerifyResponse = {
  authenticated: boolean;
  sessionExpiresAt?: string | null;
};

type RequestCodeResponse = {
  sent: boolean;
  maskedPhoneNumber: string;
  channel: "KAKAO" | "PASS";
  codeExpiresAt?: string | null;
  maxAttempts: number;
};

export default function AuthPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [channel, setChannel] = useState<"KAKAO" | "PASS">("KAKAO");
  const [code, setCode] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [requested, setRequested] = useState(false);
  const [requestInfo, setRequestInfo] = useState<RequestCodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setNextPath(next || "/");
  }, []);

  async function onRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL 설정이 필요합니다.");
      return;
    }

    setRequesting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/public/auth/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber, channel }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message ?? "인증번호 요청에 실패했습니다.");
        return;
      }

      const payload = (await response.json()) as RequestCodeResponse;
      if (!payload.sent) {
        setError("인증번호 요청에 실패했습니다.");
        return;
      }

      setRequested(true);
      setRequestInfo(payload);
      setNotice(`${payload.channel} 채널로 인증번호를 전송했습니다.`);
    } catch {
      setError("인증 요청 중 오류가 발생했습니다.");
    } finally {
      setRequesting(false);
    }
  }

  async function onVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL 설정이 필요합니다.");
      return;
    }

    setVerifying(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/public/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber, channel, code }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message ?? "인증번호가 올바르지 않습니다.");
        return;
      }

      const payload = (await response.json()) as VerifyResponse;
      if (!payload.authenticated) {
        setError("인증에 실패했습니다.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("인증 요청 중 오류가 발생했습니다.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}>
        <span className="badge">인증</span>
        <h1 className="section-title">전화번호 인증</h1>
        <p className="section-copy">전화번호를 입력하고 인증번호를 요청한 뒤 확인하면 페이지를 이용할 수 있습니다.</p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        <article className="panel" style={{ padding: 18, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>진행 순서</h2>
          <p className="section-copy" style={{ margin: 0 }}>
            1) 전화번호와 채널 선택 2) 인증번호 요청 3) 인증번호 입력 후 이동
          </p>
          <div className="surface-card" style={{ padding: 14, display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 700 }}>이동 경로</div>
            <div className="helper-text" style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}>
              {nextPath}
            </div>
          </div>
          {requestInfo ? (
            <div className="surface-card" style={{ padding: 14, display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 700 }}>최근 요청</div>
              <p className="helper-text">수신자: {requestInfo.maskedPhoneNumber}</p>
              <p className="helper-text">채널: {requestInfo.channel}</p>
              {requestInfo.codeExpiresAt ? (
                <p className="helper-text">만료: {new Date(requestInfo.codeExpiresAt).toLocaleString()}</p>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="panel" style={{ padding: 18, display: "grid", gap: 14 }}>
          <form onSubmit={onRequestCode} style={{ display: "grid", gap: 10 }}>
            <label className="field-label" htmlFor="phone-number">
              전화번호
            </label>
            <input
              id="phone-number"
              className="field-input"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="01012345678"
              autoComplete="tel"
              required
            />

            <label className="field-label" htmlFor="channel">
              전송 채널
            </label>
            <select
              id="channel"
              className="field-select"
              value={channel}
              onChange={(event) => setChannel(event.target.value as "KAKAO" | "PASS")}
            >
              <option value="KAKAO">KakaoTalk</option>
              <option value="PASS">PASS</option>
            </select>

            <button className="btn" type="submit" disabled={requesting}>
              {requesting ? "전송 중..." : "인증번호 요청"}
            </button>
          </form>

          <form onSubmit={onVerifyCode} style={{ display: "grid", gap: 10 }}>
            <label className="field-label" htmlFor="otp-code">
              인증번호
            </label>
            <input
              id="otp-code"
              className="field-input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6자리 인증번호"
              autoComplete="one-time-code"
              inputMode="numeric"
              required
            />
            <button className="btn-ghost" type="submit" disabled={verifying || !requested}>
              {verifying ? "확인 중..." : "인증 후 이동"}
            </button>
          </form>

          {notice ? <p className="success-text">{notice}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </article>
      </section>
    </div>
  );
}
