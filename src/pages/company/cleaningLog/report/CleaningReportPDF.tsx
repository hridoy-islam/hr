import {
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View
} from '@react-pdf/renderer';
import moment from '@/lib/moment-setup';
import {
  CleaningReport,
  CleaningReportMeta,
  columnLabel,
  monthGroups,
  rangeLabel
} from './reportData';

// A4 landscape is 842pt wide; what is left after the margins and the area
// column is shared by the date columns of each page
const PAGE_PADDING = 28;
const AREA_WIDTH = 160;
const DATE_SPACE = 842 - PAGE_PADDING * 2 - AREA_WIDTH;
// Each calendar month gets its own page. Columns are sized for the longest
// month, so a short or partial month keeps the same column width.
const COLUMN_WIDTH = DATE_SPACE / 31;

// A light palette: soft grey lines and tints, dark text only where it is read
const INK = '#1f2937';
const MUTED = '#6b7280';
const HEAD_BG = '#f1f5f9';
const GROUP_BG = '#f8fafc';
const RULE = '#e2e8f0';
const BORDER = '#e5e7eb';
const STRIPE = '#fbfcfd';
const TICK = '#059669';

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE_PADDING,
    paddingHorizontal: PAGE_PADDING,
    paddingBottom: 42,
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: INK
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: RULE
  },
  company: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: INK,
    letterSpacing: 0.3
  },
  title: {
    fontSize: 10,
    marginTop: 4,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  infoBlock: { alignItems: 'flex-end' },
  infoRow: { flexDirection: 'row', marginTop: 2 },
  infoLabel: {
    fontSize: 7.5,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginRight: 6
  },
  infoValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK },
  row: { flexDirection: 'row' },
  groupCell: {
    backgroundColor: GROUP_BG,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
    // The month sits centred over its days
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: INK
  },
  headCell: {
    backgroundColor: HEAD_BG,
    color: INK,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 3
  },
  headDay: { fontSize: 5.5, color: MUTED },
  headDate: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  cell: {
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 18
  },
  areaCell: {
    width: AREA_WIDTH,
    paddingHorizontal: 6,
    alignItems: 'flex-start',
    borderLeftWidth: 0.5,
    borderLeftColor: BORDER
  },
  areaName: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  areaRoom: { fontSize: 6, color: MUTED, marginTop: 1 },
  box: {
    width: 9,
    height: 9,
    borderWidth: 0.75,
    borderColor: '#cbd5e1',
    borderRadius: 1.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  boxDone: { borderColor: '#6ee7b7', backgroundColor: '#ecfdf5' },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: RULE,
    fontSize: 7,
    color: MUTED
  },
  empty: { marginTop: 24, fontSize: 10, textAlign: 'center', color: MUTED }
});

const Checkbox = ({ done }: { done: boolean }) => (
  <View style={done ? [styles.box, styles.boxDone] : styles.box}>
    {done && (
      <Svg width={7} height={7} viewBox="0 0 24 24">
        <Path
          d="M4 12.5l5 5L20 6.5"
          stroke={TICK}
          strokeWidth={4}
          fill="none"
        />
      </Svg>
    )}
  </View>
);

// Day keys (YYYY-MM-DD) split by calendar month, so no month is spread
// across two pages
const byMonth = (columns: string[]) => {
  const parts: string[][] = [];
  columns.forEach((key) => {
    const last = parts[parts.length - 1];
    if (last && last[0].slice(0, 7) === key.slice(0, 7)) last.push(key);
    else parts.push([key]);
  });
  return parts.length ? parts : [[]];
};

interface CleaningReportPDFProps {
  report: CleaningReport;
  meta: CleaningReportMeta;
}

export function CleaningReportPDF({ report, meta }: CleaningReportPDFProps) {
  const { type, columns, rows } = report;
  const parts = byMonth(columns);
  const generatedAt = moment().format('DD-MM-YYYY, HH:mm');
  const typeLabel = type === 'monthly' ? 'Monthly' : 'Daily';

  const info = (label: string, value: string) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <Document
      title={`${meta.companyName} - ${typeLabel} Cleaning Report`}
      author={meta.companyName}
    >
      {parts.map((partColumns, partIndex) => {
        const width = COLUMN_WIDTH;
        const groups = monthGroups(partColumns);

        return (
          <Page
            key={partIndex}
            size="A4"
            orientation="landscape"
            style={styles.page}
          >
            <View style={styles.header} fixed>
              <View>
                <Text style={styles.company}>{meta.companyName}</Text>
                <Text style={styles.title}>{typeLabel} Cleaning Report</Text>
              </View>
              <View style={styles.infoBlock}>
                {info('Period', rangeLabel(meta))}
                {/* Only a report narrowed to one person names them */}
                {meta.employeeName && info('Employee', meta.employeeName)}
                {info('Areas', String(rows.length))}
              </View>
            </View>

            {rows.length === 0 ? (
              <Text style={styles.empty}>
                No {type} area has been set up for this company.
              </Text>
            ) : (
              <View>
                {/* Column heads repeat on every page the table runs onto */}
                <View fixed>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.groupCell,
                        { width: AREA_WIDTH, borderLeftWidth: 0.5 }
                      ]}
                    />
                    {groups.map((group) => (
                      <View
                        key={group.label}
                        style={[styles.groupCell, { width: width * group.span }]}
                      >
                        <Text>{group.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.headCell,
                        {
                          width: AREA_WIDTH,
                          alignItems: 'flex-start',
                          paddingHorizontal: 6,
                          borderLeftWidth: 0.5
                        }
                      ]}
                    >
                      <Text style={styles.headDate}>Area</Text>
                    </View>
                    {partColumns.map((key) => {
                      const label = columnLabel(key);
                      return (
                        <View key={key} style={[styles.headCell, { width }]}>
                          <Text style={styles.headDay}>{label.top}</Text>
                          <Text style={styles.headDate}>{label.bottom}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {rows.map((row, rowIndex) => (
                  <View
                    key={`${row.areaId || row.areaName}-${rowIndex}`}
                    style={[
                      styles.row,
                      rowIndex % 2 === 1 ? { backgroundColor: STRIPE } : {}
                    ]}
                    wrap={false}
                  >
                    <View style={[styles.cell, styles.areaCell]}>
                      <Text style={styles.areaName}>{row.areaName}</Text>
                      {row.roomNumber && (
                        <Text style={styles.areaRoom}>Room {row.roomNumber}</Text>
                      )}
                    </View>
                    {partColumns.map((key) => (
                      <View key={key} style={[styles.cell, { width }]}>
                        <Checkbox done={Boolean(row.cells[key])} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.footer} fixed>
              <Text>
                {meta.companyName} · {typeLabel} Cleaning Report
              </Text>
              <Text>Generated {generatedAt}</Text>
              <Text
                render={({ pageNumber, totalPages }) =>
                  `Page ${pageNumber} of ${totalPages}`
                }
              />
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
