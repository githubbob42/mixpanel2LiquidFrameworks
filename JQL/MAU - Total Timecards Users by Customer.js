// IMPORTANT:  Do not remove/modify the next 2 lines other than modifying the dates:  THIS FILE IS USED BY AN AUTOMATED PROCESS.
// FIELDNAMES : {"Timecards_30_Day_Users__c": "from_date_30", "Timecards_60_Day_Users__c": "from_date_60", "Timecards_90_Day_Users__c": "from_date_90"}
let __params__ = { from_date: "2020-01-18", to_date: "2020-02-18" };
function main() {
  return Events(__params__)
  .filter(function(event) {

    if (!~event.name.indexOf("Timecard")) {
      return;
    }

    if (event.properties.$current_url !== undefined) {
      if (~event.properties.$current_url.indexOf(".cs")) {
        return;
      }
    }

    if (
          ~event.distinct_id.indexOf(".bes1q16") ||
          ~event.distinct_id.indexOf(".com1") ||
          ~event.distinct_id.indexOf(".devfx") ||
          ~event.distinct_id.indexOf(".dev") ||
          ~event.distinct_id.indexOf(".dev2") ||
          ~event.distinct_id.indexOf(".fsb") ||
          ~event.distinct_id.indexOf(".full") ||
          ~event.distinct_id.indexOf(".hkfull") ||
          ~event.distinct_id.indexOf(".llfs") ||
          ~event.distinct_id.indexOf(".partial") ||
          ~event.distinct_id.indexOf(".preprod1") ||
          ~event.distinct_id.indexOf(".psb") ||
          ~event.distinct_id.indexOf(".sandbox") ||
          ~event.distinct_id.indexOf(".staging") ||
          ~event.distinct_id.indexOf(".uat") ||
          ~event.distinct_id.indexOf(".veolia.com.rpm") ||
          ~event.distinct_id.indexOf(".vnauat")
      ) {
        return;
    }

    if (event.properties.email !== undefined) {
      if (~event.properties.email.indexOf("liquidframeworks")) {
        return;
      }
      if (~event.properties.email.indexOf(".qa") ||
          ~event.properties.email.indexOf("=") ||
          ~event.properties.email.indexOf("example") ||
          ~event.properties.email.indexOf("uat")
      ) {
        return;
      }
    }

    if (event.properties.username !== undefined) {
      if (~event.properties.username.indexOf("liquidframeworks")) {
        return;
      }
      if (~event.properties.username.indexOf(".qa")) {
        return;
      }
    }

    if (
          ~event.properties.organization.indexOf("FX Parigi") ||
          ~event.properties.organization.indexOf("FieldFX TSO 7") ||
          ~event.properties.organization.indexOf("liquidframeworks") ||
          ~event.properties.organization.indexOf("Wassim Test") ||
          ~event.properties.organization.indexOf("FX Managed Package Analysis") ||
          ~event.properties.organization.indexOf("LiquidFrameworks Demo") ||
          ~event.properties.organization.indexOf("Leon Yu Test ORG") ||
          ~event.properties.organization.indexOf("LiquidFrameworks, Inc.") ||
          ~event.properties.organization.indexOf("QA 7") ||
          ~event.properties.organization.indexOf("Test 8") ||
          ~event.properties.organization.indexOf("White Inc") ||
          ~event.properties.organization.indexOf("Tarantula #3") ||
          ~event.properties.organization.indexOf("OOTB Test") ||
          ~event.properties.organization.indexOf("Noble Casing, Inc. SB") ||
          ~event.properties.organization.indexOf("Koch Engineered Solutions") ||
          ~event.properties.organization.indexOf("Exadel") ||
          ~event.properties.organization.indexOf("Copy Test") ||
          ~event.properties.organization.indexOf("Burris Test") ||
          ~event.properties.organization.indexOf("XcelFX") ||
          ~event.properties.organization.indexOf("EAM Beta2") ||
          ~event.properties.organization.indexOf("FX Components") ||
          ~event.properties.organization.indexOf("Giorgi Test") ||
          ~event.properties.organization.indexOf("Liquid Frameworks (Partner Main)") ||
          ~event.properties.organization.indexOf("Sowmya Test") ||
          ~event.properties.organization.indexOf("Travis SSO Dev") ||
          ~event.properties.organization.indexOf("QA 6")
      ) {
        return;
    }

  // if (event.properties.organization.indexOf("Plummers Environmental Services")) {
  //   return;
  // }
    return event.properties.organization !== undefined;

  })
  .groupBy(["distinct_id", "properties.organizationid"], mixpanel.reducer.count())
// .groupBy(mixpanel.multiple_keys(["distinct_id","properties.organization"]), mixpanel.reducer.count())
  .groupBy([mixpanel.slice("key", 1)], mixpanel.reducer.count());
}