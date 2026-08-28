import jsPDF from "jspdf";

/**
 * Generates a downloadable PDF of selected courses — a permanent knowledge
 * record the user can keep forever.
 */
export function generateCoursesPDF(courses) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (need) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Cover page
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("My ISOLATE Knowledge", margin, y + 20);
  y += 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, y);
  y += 8;
  doc.text(`${courses.length} course${courses.length !== 1 ? "s" : ""} saved`, margin, y);
  y += 30;

  courses.forEach((course, ci) => {
    // Course header on a fresh-ish area
    ensureSpace(80);
    if (ci > 0) y += 20;
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 25;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(course.title || "Untitled Course", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const meta = [
      `Topic: ${course.topic || "—"}`,
      `Theme: ${course.theme || "—"}`,
      `Level: ${course.skill_level || "beginner"}`,
    ];
    if (course.additional_themes?.length > 0) {
      meta.push(`Additional themes: ${course.additional_themes.join(", ")}`);
    }
    doc.text(meta.join("   |   "), margin, y);
    y += 16;

    const completedCount = (course.modules || []).filter((m) => m.completed).length;
    doc.text(`Progress: ${completedCount}/${course.modules?.length || 0} modules completed`, margin, y);
    y += 22;

    (course.modules || []).forEach((mod, mi) => {
      ensureSpace(60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`Module ${mi + 1}: ${mod.title || "Untitled"}`, margin, y);
      y += 14;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text(`Concept: ${mod.concept || ""}`, margin, y);
      y += 12;

      if (mod.theme_hook) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const hook = doc.splitTextToSize(`"${mod.theme_hook}"`, contentW);
        doc.text(hook, margin, y);
        y += hook.length * 11 + 4;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const content = doc.splitTextToSize(mod.content || "", contentW);
      ensureSpace(content.length * 12 + 10);
      doc.text(content, margin, y);
      y += content.length * 12 + 8;

      if (mod.real_facts) {
        ensureSpace(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Here's what's actually true:", margin, y);
        y += 12;
        doc.setFont("helvetica", "normal");
        const facts = doc.splitTextToSize(mod.real_facts, contentW);
        ensureSpace(facts.length * 12 + 8);
        doc.text(facts, margin, y);
        y += facts.length * 12 + 12;
      }

      // Knowledge check
      if (mod.knowledge_check?.length > 0) {
        ensureSpace(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Knowledge Check:", margin, y);
        y += 14;
        mod.knowledge_check.forEach((q, qi) => {
          ensureSpace(30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          const qText = doc.splitTextToSize(`Q${qi + 1}. ${q.question}`, contentW);
          doc.text(qText, margin, y);
          y += qText.length * 11;
          (q.options || []).forEach((opt, oi) => {
            ensureSpace(14);
            doc.setFont("helvetica", oi === q.answer ? "bold" : "normal");
            doc.setFontSize(9);
            const prefix = oi === q.answer ? "  ✓ " : "    ";
            const optText = doc.splitTextToSize(`${prefix}${opt}`, contentW - 10);
            doc.text(optText, margin + 10, y);
            y += optText.length * 11;
          });
          y += 6;
        });
      }

      y += 14;
    });
  });

  // Footer page numbers
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 160);
    doc.text(`ISOLATE — Page ${i} of ${pages}`, margin, pageH - 15);
    doc.setTextColor(0, 0, 0);
  }

  doc.save("isolate-knowledge.pdf");
}