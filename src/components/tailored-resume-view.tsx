import { cn } from "@/lib/utils";
import type {
  TailoredResume,
  TailoredResumeCertificationItem,
  TailoredResumeEducationItem,
  TailoredResumeExperienceItem,
  TailoredResumeLocale,
  TailoredResumeProjectItem,
  TailoredResumeSectionKey,
  TailoredResumeSkillGroup,
} from "@/lib/missions";
import type { ReactNode } from "react";

type TailoredResumeViewProps = {
  resume: TailoredResume;
};

const SECTION_KEYS: TailoredResumeSectionKey[] = [
  "summary",
  "skillGroups",
  "experience",
  "projects",
  "education",
  "certifications",
];

const SECTION_LABELS: Record<
  TailoredResumeLocale,
  Record<TailoredResumeSectionKey, string>
> = {
  "zh-CN": {
    summary: "职业摘要",
    skillGroups: "核心技能",
    experience: "工作经历",
    projects: "项目经历",
    education: "教育背景",
    certifications: "证书资质",
    additional: "补充信息",
  },
  "en-US": {
    summary: "Summary",
    skillGroups: "Skills",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    certifications: "Certifications",
    additional: "Additional",
  },
};

function normalizeSectionOrder(order: TailoredResumeSectionKey[] | undefined) {
  const unique = new Set<TailoredResumeSectionKey>();

  for (const key of order ?? []) {
    if (SECTION_KEYS.includes(key)) {
      unique.add(key);
    }
  }

  for (const key of SECTION_KEYS) {
    unique.add(key);
  }

  return [...unique];
}

function toExternalHref(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function toDisplayUrl(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function getThemeClasses(resume: TailoredResume) {
  const density = resume.templateHints.density;

  const densityClasses =
    density === "compact"
      ? {
          body: "gap-6 px-5 py-5 sm:px-7 sm:py-7 lg:gap-7 lg:px-9 lg:py-8",
          header: "gap-4 px-5 py-5 sm:px-7 sm:py-6 lg:px-9 lg:py-7",
          section: "gap-3",
          list: "gap-2",
          chip: "px-2.5 py-1 text-[11px]",
        }
      : {
          body: "gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:gap-9 lg:px-10 lg:py-9",
          header: "gap-5 px-5 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8",
          section: "gap-4",
          list: "gap-3",
          chip: "px-3 py-1.5 text-[11px]",
        };

  switch (resume.templateHints.variant) {
    case "classic":
      return {
        ...densityClasses,
        shell:
          "border-stone-200/80 bg-[linear-gradient(180deg,#fffdf8_0%,#fffdf7_28%,#fffdfa_100%)] shadow-[0_40px_100px_rgba(120,94,48,0.10)]",
        hero:
          "border-b border-stone-200/80 bg-[radial-gradient(circle_at_top_left,rgba(193,154,107,0.14),transparent_34%),linear-gradient(180deg,rgba(255,251,240,0.96),rgba(255,255,255,0.92))]",
        accent: "text-amber-900",
        eyebrow: "text-amber-800/75",
        divider: "border-stone-200/80",
        panel: "border-stone-200/70 bg-white/86",
        chipTone:
          "border-amber-200/80 bg-amber-50/80 text-amber-900/90",
      };
    case "compact":
      return {
        ...densityClasses,
        shell:
          "border-slate-200/80 bg-[linear-gradient(180deg,#fbfdff_0%,#f8fbff_45%,#ffffff_100%)] shadow-[0_32px_90px_rgba(15,23,42,0.08)]",
        hero:
          "border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_34%),linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,0.96))]",
        accent: "text-slate-950",
        eyebrow: "text-sky-700/80",
        divider: "border-slate-200/80",
        panel: "border-slate-200/75 bg-white/88",
        chipTone: "border-sky-200/80 bg-sky-50/85 text-sky-900/85",
      };
    default:
      return {
        ...densityClasses,
        shell:
          "border-slate-200/80 bg-[linear-gradient(180deg,#fafdff_0%,#ffffff_24%,#fbfcff_100%)] shadow-[0_36px_96px_rgba(15,23,42,0.10)]",
        hero:
          "border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_32%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_30%),linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,0.96))]",
        accent: "text-slate-950",
        eyebrow: "text-sky-700/80",
        divider: "border-slate-200/80",
        panel: "border-slate-200/75 bg-white/90",
        chipTone: "border-sky-200/80 bg-sky-50/85 text-sky-900/85",
      };
  }
}

function ResumeSection({
  title,
  children,
  eyebrowClassName,
  className,
}: {
  title: string;
  children: ReactNode;
  eyebrowClassName: string;
  className?: string;
}) {
  return (
    <section className={cn("grid", className)}>
      <div className="flex items-center gap-3">
        <div className={cn("text-[11px] font-semibold uppercase tracking-[0.24em]", eyebrowClassName)}>
          {title}
        </div>
        <div className="h-px flex-1 bg-current/10" />
      </div>
      {children}
    </section>
  );
}

function ContactItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </>
  );

  if (!href) {
    return <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">{content}</div>;
  }

  return (
    <a
      href={href}
      target={href.startsWith("mailto:") || href.startsWith("tel:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") || href.startsWith("tel:") ? undefined : "noreferrer"}
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm transition hover:text-primary"
    >
      {content}
    </a>
  );
}

function ExperienceCard({
  item,
  chipClassName,
  listClassName,
}: {
  item: TailoredResumeExperienceItem;
  chipClassName: string;
  listClassName: string;
}) {
  return (
    <article className="grid gap-4 border-b border-slate-200/80 pb-5 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="font-heading text-[1.25rem] tracking-[-0.04em] text-slate-950">
            {item.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{item.company}</span>
            {item.location ? <span>{item.location}</span> : null}
            {item.employmentType ? <span>{item.employmentType}</span> : null}
          </div>
        </div>
        <div className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600">
          {item.dateLabel}
        </div>
      </div>

      {item.summary ? (
        <p className="mt-4 text-sm leading-7 text-slate-700">{item.summary}</p>
      ) : null}

      {item.bullets.length > 0 ? (
        <ul className={cn("mt-4 grid list-disc gap-2 pl-5 text-sm leading-7 text-slate-700 marker:text-slate-400", listClassName)}>
          {item.bullets.map((bullet, index) => (
            <li key={`${item.id}-bullet-${index}`}>{bullet}</li>
          ))}
        </ul>
      ) : null}

      {item.techStack?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.techStack.map((tech) => (
            <span
              key={`${item.id}-${tech}`}
              className={cn("rounded-full border font-medium", chipClassName)}
            >
              {tech}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ProjectCard({
  item,
  chipClassName,
  listClassName,
}: {
  item: TailoredResumeProjectItem;
  chipClassName: string;
  listClassName: string;
}) {
  return (
    <article className="grid gap-4 border-b border-slate-200/80 pb-5 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="font-heading text-[1.2rem] tracking-[-0.04em] text-slate-950">
            {item.name}
          </h3>
          {item.role ? (
            <p className="text-sm font-medium text-slate-600">{item.role}</p>
          ) : null}
        </div>
        {item.dateLabel ? (
          <div className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600">
            {item.dateLabel}
          </div>
        ) : null}
      </div>

      {item.summary ? (
        <p className="mt-4 text-sm leading-7 text-slate-700">{item.summary}</p>
      ) : null}

      {item.bullets.length > 0 ? (
        <ul className={cn("mt-4 grid list-disc gap-2 pl-5 text-sm leading-7 text-slate-700 marker:text-slate-400", listClassName)}>
          {item.bullets.map((bullet, index) => (
            <li key={`${item.id}-bullet-${index}`}>{bullet}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {item.techStack?.map((tech) => (
          <span
            key={`${item.id}-${tech}`}
            className={cn("rounded-full border font-medium", chipClassName)}
          >
            {tech}
          </span>
        ))}
        {item.links?.map((link) => (
          <a
            key={`${item.id}-${link.url}`}
            href={toExternalHref(link.url)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-primary/35 hover:text-primary"
          >
            {link.label}
          </a>
        ))}
      </div>
    </article>
  );
}

function EducationCard({
  item,
}: {
  item: TailoredResumeEducationItem;
}) {
  return (
    <article className="grid gap-3 border-b border-slate-200/80 pb-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-base font-semibold text-slate-900">{item.school}</h3>
          <p className="text-sm text-slate-600">
            {[item.degree, item.major].filter(Boolean).join(" · ") || "学历信息待补充"}
          </p>
        </div>
        {(item.dateLabel || item.location) && (
          <p className="text-right text-xs leading-6 text-slate-500">
            {item.dateLabel}
            {item.dateLabel && item.location ? " · " : ""}
            {item.location}
          </p>
        )}
      </div>

      {item.bullets?.length ? (
        <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-sm leading-7 text-slate-700 marker:text-slate-400">
          {item.bullets.map((bullet, index) => (
            <li key={`${item.id}-bullet-${index}`}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function CertificationList({
  items,
}: {
  items: TailoredResumeCertificationItem[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-[18px] border border-slate-200/75 bg-white/62 p-4"
        >
          <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {[item.issuer, item.dateLabel].filter(Boolean).join(" · ")}
          </p>
        </article>
      ))}
    </div>
  );
}

export function TailoredResumeView({ resume }: TailoredResumeViewProps) {
  const theme = getThemeClasses(resume);
  const labels = SECTION_LABELS[resume.locale] ?? SECTION_LABELS["zh-CN"];
  const sectionOrder = normalizeSectionOrder(resume.templateHints.sectionOrder);
  const contactItems = [
    resume.basics.email
      ? {
          label: resume.locale === "en-US" ? "Email" : "邮箱",
          value: resume.basics.email,
          href: `mailto:${resume.basics.email}`,
        }
      : null,
    resume.basics.phone
      ? {
          label: resume.locale === "en-US" ? "Phone" : "电话",
          value: resume.basics.phone,
          href: `tel:${resume.basics.phone}`,
        }
      : null,
    resume.basics.location
      ? {
          label: resume.locale === "en-US" ? "Location" : "地点",
          value: resume.basics.location,
        }
      : null,
    resume.basics.website
      ? {
          label: "Website",
          value: toDisplayUrl(resume.basics.website),
          href: toExternalHref(resume.basics.website),
        }
      : null,
    resume.basics.linkedin
      ? {
          label: "LinkedIn",
          value: toDisplayUrl(resume.basics.linkedin),
          href: toExternalHref(resume.basics.linkedin),
        }
      : null,
    resume.basics.github
      ? {
          label: "GitHub",
          value: toDisplayUrl(resume.basics.github),
          href: toExternalHref(resume.basics.github),
        }
      : null,
    resume.basics.portfolio
      ? {
          label: resume.locale === "en-US" ? "Portfolio" : "作品集",
          value: toDisplayUrl(resume.basics.portfolio),
          href: toExternalHref(resume.basics.portfolio),
        }
      : null,
  ].filter(
    (
      item,
    ): item is {
      label: string;
      value: string;
      href?: string;
    } => item !== null,
  );

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <div className={cn("overflow-hidden rounded-[34px] border", theme.shell)}>
        <header className={cn("relative overflow-hidden", theme.hero)}>
          <div className={cn("relative grid", theme.header)}>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.82fr)] lg:gap-8">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <h1 className={cn("font-heading text-4xl leading-none tracking-[-0.07em] sm:text-[3.4rem]", theme.accent)}>
                    {resume.basics.fullName}
                  </h1>
                  {resume.basics.headline ? (
                    <p className="max-w-3xl text-base leading-8 text-slate-700 sm:text-[1.05rem]">
                      {resume.basics.headline}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1 text-sm text-slate-600">
                  <span className="font-semibold tracking-[0.02em] text-slate-900">
                    {resume.targetRole}
                  </span>
                  {resume.targetCompany ? (
                    <span>
                      {resume.locale === "en-US"
                        ? `Tailored toward ${resume.targetCompany}`
                        : `聚焦 ${resume.targetCompany} 的岗位要求`}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid content-start gap-2 rounded-[22px] border border-white/80 bg-white/70 p-4">
                {contactItems.length > 0 ? (
                  contactItems.map((item) => (
                    <ContactItem
                      key={`${item.label}-${item.value}`}
                      label={item.label}
                      value={item.value}
                      href={item.href}
                    />
                  ))
                ) : (
                  <p className="text-sm leading-7 text-slate-500">
                    {resume.locale === "en-US"
                      ? "Contact information can be added later."
                      : "联系信息稍后可以继续补充。"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className={cn("grid", theme.body)}>
          {sectionOrder.map((sectionKey) => {
            switch (sectionKey) {
              case "summary":
                if (!resume.summary.lines.length) return null;
                return (
                  <ResumeSection
                    key={sectionKey}
                    title={resume.summary.title || labels.summary}
                    eyebrowClassName={theme.eyebrow}
                    className={theme.section}
                  >
                    <div className="grid gap-3">
                      {resume.summary.lines.map((line, index) => (
                        <p
                          key={`${sectionKey}-${index}`}
                          className="text-[15px] leading-8 text-slate-700"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </ResumeSection>
                );

              case "skillGroups":
                if (!resume.skillGroups.length) return null;
                return (
                  <ResumeSection
                    key={sectionKey}
                    title={labels.skillGroups}
                    eyebrowClassName={theme.eyebrow}
                    className={theme.section}
                  >
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {resume.skillGroups.map((group: TailoredResumeSkillGroup) => (
                        <article
                          key={group.label}
                          className="grid gap-3 border-b border-slate-200/80 pb-4 last:border-b-0 sm:pb-5 xl:border-b-0 xl:border-r xl:pr-5 xl:last:border-r-0 xl:last:pr-0"
                        >
                          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {group.label}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {group.items.map((item) => (
                              <span
                                key={`${group.label}-${item}`}
                                className={cn("rounded-full border font-medium", theme.chipTone, theme.chip)}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </ResumeSection>
                );

              case "experience":
                if (!resume.experience.length) return null;
                return (
                  <ResumeSection
                    key={sectionKey}
                    title={labels.experience}
                    eyebrowClassName={theme.eyebrow}
                    className={theme.section}
                  >
                    <div className={cn("grid", theme.list)}>
                      {resume.experience.map((item) => (
                        <ExperienceCard
                          key={item.id}
                          item={item}
                          chipClassName={cn(theme.chipTone, theme.chip)}
                          listClassName={theme.list}
                        />
                      ))}
                    </div>
                  </ResumeSection>
                );

              case "projects":
                if (!resume.projects.length) return null;
                return (
                  <ResumeSection
                    key={sectionKey}
                    title={labels.projects}
                    eyebrowClassName={theme.eyebrow}
                    className={theme.section}
                  >
                    <div className={cn("grid", theme.list)}>
                      {resume.projects.map((item) => (
                        <ProjectCard
                          key={item.id}
                          item={item}
                          chipClassName={cn(theme.chipTone, theme.chip)}
                          listClassName={theme.list}
                        />
                      ))}
                    </div>
                  </ResumeSection>
                );

              case "education":
                if (!resume.education.length) return null;
                return (
                  <ResumeSection
                    key={sectionKey}
                    title={labels.education}
                    eyebrowClassName={theme.eyebrow}
                    className={theme.section}
                  >
                    <div className="grid gap-3 lg:grid-cols-2">
                      {resume.education.map((item) => (
                        <EducationCard
                          key={item.id}
                          item={item}
                        />
                      ))}
                    </div>
                  </ResumeSection>
                );

              case "certifications":
                if (!resume.certifications?.length) return null;
                return (
                  <ResumeSection
                    key={sectionKey}
                    title={labels.certifications}
                    eyebrowClassName={theme.eyebrow}
                    className={theme.section}
                  >
                    <CertificationList
                      items={resume.certifications}
                    />
                  </ResumeSection>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}
