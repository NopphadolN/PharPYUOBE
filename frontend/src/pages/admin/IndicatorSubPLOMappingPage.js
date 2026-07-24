import AdminMenu from '../../components/AdminMenu';
import MappingManager from '../../components/MappingManager';

export default function IndicatorSubPLOMappingPage() {

  return (

    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1">

        <MappingManager

          title="Indicator ↔ SubPLO Mapping"

          itemApi="/plos"
          mappingApi="/indicatorSubploMapping"

          itemKey="plo_indicator_id"
          childField="indicators"

          codeField="subplo_code"

          addPayloadKey="plo_indicator_id"
          removePayloadKey="plo_indicator_id"

          targetPayloadKey="sub_plo_id"

          popupApi="/admin/subplos/list"
          popupIdField="id"
          popupLabelField="code"

          mappedLabelField="subplo_code"

          matrixRowField="sub_plo_id"
          matrixRowLabel="subplo_code"

          showMatrix={false}

        />

      </div>

    </div>

  );

}