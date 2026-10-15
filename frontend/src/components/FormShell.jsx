import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";
import api from "@/lib/api";
import { useLang } from "@/lib/i18n";

const inputClass =
  "w-full border border-forest/25 bg-white px-4 py-3.5 text-sm text-ink placeholder:text-sage/60 transition-colors focus:border-forest";

const Field = ({ field, value, onChange, type }) => {
  const id = `form-${type}-${field.name}-input`;
  if (field.kind === "textarea") {
    return (
      <textarea
        id={id}
        data-testid={id}
        rows={4}
        required={field.required}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={inputClass}
      />
    );
  }
  if (field.kind === "select") {
    return (
      <select
        id={id}
        data-testid={id}
        required={field.required}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={`${inputClass} ${value ? "text-ink" : "text-sage/60"}`}
      >
        <option value="" disabled>
          {field.placeholder}
        </option>
        {field.options.map((o) => (
          <option key={o} value={o} className="text-ink">
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (field.kind === "radio") {
    return (
      <div className="flex flex-wrap gap-2" data-testid={id}>
        {field.options.map((o) => (
          <button
            key={o}
            type="button"
            data-testid={`${id}-${o.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            onClick={() => onChange(field.name, o)}
            className={`border px-5 py-2.5 text-sm font-semibold transition-colors ${value === o
                ? "border-forest bg-forest text-bone"
                : "border-forest/25 bg-white text-forest hover:border-forest"
              }`}
          >
            {o}
          </button>
        ))}
      </div>
    );
  }
  return (
    <input
      id={id}
      data-testid={id}
      type={field.kind || "text"}
      required={field.required}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(field.name, e.target.value)}
      className={inputClass}
    />
  );
};

const FormShell = ({ type, fields, submitLabel, successMessage, testId, initialValues = {} }) => {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLang();

  const onChange = (name, v) => setValues((prev) => ({ ...prev, [name]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/submissions", { type, payload: values });
      toast.success(successMessage || "Thank you-we have received your submission.");
      setValues({});
      e.target.reset?.();
    } catch (err) {
      toast.error(t.form.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid={testId}>
      <div className="grid gap-6 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.kind === "textarea" || f.kind === "radio" || f.full ? "md:col-span-2" : ""}>
            <label
              htmlFor={`form-${type}-${f.name}-input`}
              className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-forest"
            >
              {f.label}
              {f.required && <span className="text-maple"> *</span>}
            </label>
            <Field field={f} type={type} value={values[f.name] || ""} onChange={onChange} />
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={submitting}
        data-testid={`form-${type}-submit-button`}
        className="group inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple disabled:opacity-60"
      >
        {submitting ? t.form.sending : submitLabel}
        {!submitting && (
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </button>
    </form>
  );
};

export default FormShell;
