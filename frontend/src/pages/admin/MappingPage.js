import AdminMenu from '../../components/AdminMenu';
import MappingManager from '../../components/MappingManager';

export default function IndicatorMappingPage() {

  return (

    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1">

        <MappingManager
        title="PLO Indicator Mapping"
        itemApi="/plos"
        mappingApi="/mapping"
        itemKey="plo_indicator_id"
        codeField="indicator_code"
        childField="indicators"
        addPayloadKey="plo_indicator_id"
        removePayloadKey="plo_indicator_id"
      />

      </div>

    </div>

  );

}