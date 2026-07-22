import AdminMenu from '../../components/AdminMenu';
import MappingManager from '../../components/MappingManager';

export default function SubPLOMappingPage() {

  return (

    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1">

        <MappingManager
          title="SubPLO Mapping"
          itemApi="/admin/subplos"
          mappingApi="/subplo-mapping"
          itemKey="sub_plo_id"
          codeField="subplo_code"
          childField="children"
          addPayloadKey="sub_plo_id"
          removePayloadKey="sub_plo_id"
        />

      </div>

    </div>

  );

}